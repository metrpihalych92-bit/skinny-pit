# План разработки: Pomodoro Timer (Неоновый футуристичный)

## Тип проекта
Одностраничное веб-приложение (SPA) — чистый frontend, без backend.

## Стек технологий
- **Framework:** React 18 + TypeScript
- **Сборщик:** Vite
- **Стилизация:** CSS Modules + CSS Custom Properties (переменные для тем)
- **Звук:** Web Audio API (встроен в браузер)
- **Хранилище:** localStorage (настройки, тема)
- **Шрифты:** Google Fonts — Orbitron (таймер), Inter (UI)

---

## Структура файлов проекта

```
pomodoro-timer/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── favicon.svg          # SVG-иконка томата/таймера
└── src/
    ├── main.tsx              # Точка входа React
    ├── App.tsx               # Корневой компонент, ThemeProvider
    ├── App.module.css        # Глобальные стили + CSS-переменные тем
    ├── index.css             # Сброс стилей, шрифты
    │
    ├── hooks/
    │   ├── useTimer.ts       # Логика таймера (tick, start/pause/reset)
    │   ├── useSettings.ts    # Настройки с localStorage
    │   └── useSound.ts       # Web Audio API — синтез звуков
    │
    ├── components/
    │   ├── Header/
    │   │   ├── Header.tsx
    │   │   └── Header.module.css
    │   │
    │   ├── Timer/
    │   │   ├── Timer.tsx            # Контейнер: SVG + дисплей + фаза
    │   │   ├── Timer.module.css
    │   │   ├── CircularProgress.tsx # SVG кольцо с glow-эффектом
    │   │   └── CircularProgress.module.css
    │   │
    │   ├── Controls/
    │   │   ├── Controls.tsx         # Start/Pause + Reset кнопки
    │   │   └── Controls.module.css
    │   │
    │   ├── CycleIndicator/
    │   │   ├── CycleIndicator.tsx   # Точки-индикаторы циклов
    │   │   └── CycleIndicator.module.css
    │   │
    │   └── Settings/
    │       ├── Settings.tsx         # Панель настроек (раскрывается)
    │       ├── Settings.module.css
    │       ├── NumberInput.tsx      # Переиспользуемый числовой ввод
    │       └── Toggle.tsx           # Переключатель on/off
    │
    └── types/
        └── index.ts                 # TypeScript типы и интерфейсы
```

---

## TypeScript типы (`src/types/index.ts`)

```typescript
export type Phase = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Settings {
  workDuration: number;       // минуты, default: 25
  shortBreakDuration: number; // минуты, default: 5
  longBreakDuration: number;  // минуты, default: 15
  cyclesBeforeLongBreak: number; // default: 4
  autoStart: boolean;         // автозапуск следующего периода
  soundEnabled: boolean;      // звуковые сигналы
}

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  timeLeft: number;           // секунды
  currentCycle: number;       // текущий цикл (1..cyclesBeforeLongBreak)
  completedCycles: number;    // всего завершённых рабочих сессий
}
```

---

## Хук `useSettings` (`src/hooks/useSettings.ts`)

**Ответственность:** загрузка/сохранение настроек из localStorage.

```typescript
const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStart: false,
  soundEnabled: true,
};

// При монтировании: читать из localStorage или использовать defaults
// При изменении: автоматически сохранять в localStorage
// Экспортирует: settings, updateSetting(key, value), resetSettings()
```

---

## Хук `useSound` (`src/hooks/useSound.ts`)

**Ответственность:** синтез звуковых сигналов через Web Audio API.

Звуки:
- **Конец рабочей сессии:** 3 коротких бипа (880Hz → 1047Hz → 1319Hz)
- **Конец короткого перерыва:** 2 бипа (659Hz → 880Hz)
- **Конец длинного перерыва:** 1 длинный низкий тон (440Hz, 0.6s)

```typescript
// AudioContext создаётся lazily — только после первого user interaction
// Экспортирует: playSound(phase: Phase) => void
// Важно: проверять settings.soundEnabled перед воспроизведением
```

---

## Хук `useTimer` (`src/hooks/useTimer.ts`)

**Ответственность:** вся логика таймера.

### Алгоритм точного таймера:
```typescript
// Не использовать накапливающийся счётчик тиков
// Хранить startTimestamp = Date.now() при запуске/возобновлении
// На каждом тике: timeLeft = totalDuration - (Date.now() - startTimestamp)
// setInterval 500ms только для обновления UI
```

### Логика смены фаз:
```
При timeLeft <= 0:
  1. Воспроизвести звук для текущей фазы
  2. Если фаза === 'work':
     - currentCycle++
     - Если currentCycle >= cyclesBeforeLongBreak:
       - Следующая фаза: 'longBreak'
       - completedCycles++
       - currentCycle = 0
     - Иначе:
       - Следующая фаза: 'shortBreak'
  3. Если фаза === 'shortBreak' или 'longBreak':
     - Следующая фаза: 'work'
  4. Установить timeLeft = duration следующей фазы
  5. Обновить document.title
  6. Если settings.autoStart === true: запустить таймер автоматически
     Иначе: перейти в статус 'idle'
```

### Экспортируемый API:
```typescript
{
  state: TimerState,
  start: () => void,
  pause: () => void,
  reset: () => void,   // сброс текущей фазы
  fullReset: () => void // полный сброс всего (все циклы, фазы)
}
```

---

## Компонент `CircularProgress` (`src/components/Timer/CircularProgress.tsx`)

### SVG-параметры:
```typescript
const RADIUS = 140;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~879.6

// Прогресс: от 1.0 (полный) до 0.0 (истёк)
const progress = timeLeft / totalDuration;
const dashOffset = CIRCUMFERENCE * (1 - progress);

// strokeDasharray={CIRCUMFERENCE}
// strokeDashoffset={dashOffset}
// transition: stroke-dashoffset 0.5s linear
```

### Слои SVG (снизу вверх):
1. **Фоновое кольцо** — тёмно-серый, непрозрачный
2. **Прогресс-кольцо** — цветное, с CSS filter: drop-shadow (glow)
3. **Центральный контент** (foreignObject или HTML поверх SVG):
   - Отображение времени MM:SS (шрифт Orbitron, большой)
   - Название фазы (Work / Break / Long Break)

### Цвет кольца по фазе:
- `work` → `#a855f7` (фиолетовый)
- `shortBreak` → `#06b6d4` (циановый)
- `longBreak` → `#10b981` (изумрудный)

---

## CSS-переменные тем (`src/App.module.css`)

```css
/* Тёмная тема (по умолчанию) */
[data-theme="dark"] {
  --bg-primary: #0a0a0f;
  --bg-card: #12121a;
  --bg-card-hover: #1a1a2e;
  --border-color: rgba(168, 85, 247, 0.3);
  --text-primary: #e2e8f0;
  --text-muted: #64748b;
  --accent-work: #a855f7;
  --accent-break: #06b6d4;
  --accent-long: #10b981;
  --glow-work: 0 0 10px #a855f7, 0 0 20px #a855f7, 0 0 40px #7c3aed;
  --glow-break: 0 0 10px #06b6d4, 0 0 20px #06b6d4, 0 0 40px #0891b2;
  --glow-long: 0 0 10px #10b981, 0 0 20px #10b981, 0 0 40px #059669;
}

/* Светлая тема */
[data-theme="light"] {
  --bg-primary: #f0f0ff;
  --bg-card: #ffffff;
  --bg-card-hover: #f5f0ff;
  --border-color: rgba(124, 58, 237, 0.4);
  --text-primary: #1e1b4b;
  --text-muted: #6b7280;
  --accent-work: #7c3aed;
  --accent-break: #0891b2;
  --accent-long: #059669;
  --glow-work: 0 0 8px rgba(124, 58, 237, 0.5), 0 0 16px rgba(124, 58, 237, 0.3);
  --glow-break: 0 0 8px rgba(8, 145, 178, 0.5), 0 0 16px rgba(8, 145, 178, 0.3);
  --glow-long: 0 0 8px rgba(5, 150, 105, 0.5), 0 0 16px rgba(5, 150, 105, 0.3);
}
```

---

## Компонент `Settings`

### UX-паттерн:
- Кнопка "Settings" / шестерёнка внизу основного экрана
- При клике — анимированное разворачивание панели вниз (CSS max-height transition)
- Или: модальное окно с glassmorphism эффектом

### Поля настроек:
| Поле | Тип | Min | Max | Default |
|------|-----|-----|-----|---------|
| Work Duration | number input | 1 | 99 | 25 мин |
| Short Break | number input | 1 | 30 | 5 мин |
| Long Break | number input | 1 | 60 | 15 мин |
| Cycles | number input | 1 | 10 | 4 |
| Auto-start | toggle | — | — | false |
| Sound | toggle | — | — | true |

**Важно:** при изменении настроек — сбрасывать активный таймер (если запущен).

---

## Компонент `Header`

- Название "POMODORO" с neon text-shadow
- Переключатель темы (иконка луны/солнца) — правый верхний угол
- Переключатель звука (иконка колокола) — рядом с темой

---

## Компонент `CycleIndicator`

- Отображает `cyclesBeforeLongBreak` точек
- Заполненные точки (с glow) = завершённые рабочие сессии в текущем раунде
- Текущая активная (мигающая) = `currentCycle`
- Под таймером, горизонтально

---

## Шаги разработки (порядок для developer-агента)

### Шаг 1: Инициализация проекта
1. `npm create vite@latest pomodoro-timer -- --template react-ts`
2. Установка зависимостей: `npm install`
3. Добавить в `index.html`: импорт Google Fonts (Orbitron + Inter)
4. Настроить `vite.config.ts` (base path если нужно)
5. Очистить стартовые файлы Vite (удалить лишнее из App.tsx, убрать App.css)

### Шаг 2: Типы и хуки (бизнес-логика)
1. Создать `src/types/index.ts` — все TypeScript интерфейсы
2. Создать `src/hooks/useSettings.ts` — localStorage + defaults
3. Создать `src/hooks/useSound.ts` — Web Audio API
4. Создать `src/hooks/useTimer.ts` — логика таймера, смена фаз

### Шаг 3: CSS-переменные и базовые стили
1. Создать `src/index.css` — reset, body, шрифты, scrollbar
2. Создать `src/App.module.css` — CSS-переменные тем, layout

### Шаг 4: Компоненты (снизу вверх)
1. `CircularProgress.tsx` — SVG прогресс-кольцо с glow
2. `Timer.tsx` — объединить CircularProgress + TimeDisplay + PhaseLabel
3. `Controls.tsx` — кнопки Start/Pause и Reset
4. `CycleIndicator.tsx` — точки-индикаторы
5. `Toggle.tsx` + `NumberInput.tsx` — атомарные компоненты
6. `Settings.tsx` — панель настроек
7. `Header.tsx` — шапка с переключателями

### Шаг 5: Сборка в App.tsx
1. Собрать все компоненты в `App.tsx`
2. Подключить `useTimer`, `useSettings`, `useSound`
3. Связать props: настройки → таймер, звук → таймер
4. `data-theme` атрибут на `<html>` или `<div>` корневом

### Шаг 6: Полировка
1. Анимация пульсации кольца при активном таймере
2. `document.title` обновление с оставшимся временем
3. Адаптивность (мобильный, планшет)
4. Проверить autoplay policy: AudioContext только после клика
5. Тестирование всех переходов фаз

---

## Критические замечания для разработчика

1. **Точность таймера:** обязательно использовать `Date.now()` а не счётчик тиков setInterval
2. **AudioContext:** создавать не при инициализации, а при первом взаимодействии (клик Start)
3. **CSS Transitions:** добавить `transition: all 0.3s ease` к CSS-переменным для плавного переключения тем
4. **SVG viewBox:** использовать `viewBox="0 0 300 300"` для адаптивности кольца
5. **strokeLinecap="round":** для скруглённых концов прогресс-кольца (эстетика)
6. **Rotate transform:** прогресс-кольцо начинается сверху (12 часов) через `transform: rotate(-90deg)`

---

## Команды запуска готового проекта

```bash
cd pomodoro-timer
npm install
npm run dev        # dev-сервер: http://localhost:5173
npm run build      # production build в dist/
npm run preview    # preview production build
```

---

## Итоговый артефакт

Готовое приложение размещается в папке `pomodoro-timer/` внутри рабочей директории.
После сборки `npm run build` — готовый `dist/` для деплоя на любой статический хостинг (Netlify, GitHub Pages, Vercel).
