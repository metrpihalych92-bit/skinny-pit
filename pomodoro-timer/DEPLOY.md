# Инструкция по запуску и публикации — Pomodoro Timer

## Описание проекта

Футуристичный помодоро-таймер с неоново-фиолетовым дизайном, реализованный на React + TypeScript + Vite.

**Возможности:**
- Настройка количества циклов, длительности работы и перерывов
- Автозапуск следующего периода
- Звуковые сигналы при завершении периода
- Переключение тёмной/светлой темы
- Кнопки запуска, паузы и сброса

---

## Структура проекта

```
pomodoro-timer/
├── src/
│   ├── App.tsx              # Корневой компонент
│   ├── components/          # UI-компоненты таймера
│   ├── hooks/               # Логика таймера (useTimer, useSound и др.)
│   ├── types/               # TypeScript-типы
│   └── index.css            # Глобальные стили (неон/фиолетовая тема)
├── dist/                    # Собранный продакшн-билд (готов к деплою)
├── public/                  # Статические ресурсы
└── package.json
```

---

## Предварительные требования

- [Node.js](https://nodejs.org/) версии **18 или выше**
- npm (идёт в комплекте с Node.js)

---

## Запуск локально

### 1. Режим разработки (с горячей перезагрузкой)

```bash
cd pomodoro-timer
npm install
npm run dev
```

Приложение откроется по адресу: **http://localhost:5173**

### 2. Предпросмотр продакшн-сборки

Билд уже собран и находится в папке `dist/`. Запуск предпросмотра:

```bash
cd pomodoro-timer
npm run preview
```

Приложение откроется по адресу: **http://localhost:4173**

### 3. Пересборка (если нужно изменить код)

```bash
cd pomodoro-timer
npm run build
```

Результат будет в папке `dist/`.

---

## Деплой на хостинг

Приложение является полностью статическим (SPA) — для публикации достаточно загрузить содержимое папки `dist/` на любой хостинг статики.

---

### Вариант 1: Netlify (рекомендуется — бесплатно, просто)

#### Через drag & drop (без регистрации кода в git):

1. Зайдите на [app.netlify.com](https://app.netlify.com)
2. Перетащите папку `pomodoro-timer/dist/` прямо в браузер
3. Netlify автоматически опубликует сайт и выдаст URL

#### Через Netlify CLI:

```bash
npm install -g netlify-cli
cd pomodoro-timer
netlify deploy --prod --dir=dist
```

---

### Вариант 2: Vercel

```bash
npm install -g vercel
cd pomodoro-timer
vercel --prod
```

При первом запуске Vercel спросит настройки:
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

---

### Вариант 3: GitHub Pages

1. Загрузите проект на GitHub
2. Обновите `vite.config.ts`, добавив `base`:

```ts
export default defineConfig({
  base: '/pomodoro-timer/',  // имя вашего репозитория
  plugins: [react()],
})
```

3. Пересоберите: `npm run build`
4. В настройках репозитория (Settings → Pages) выберите источник **GitHub Actions**
5. Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd pomodoro-timer && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./pomodoro-timer/dist
```

---

### Вариант 4: Локальный сервер (nginx / serve)

#### С помощью `serve` (Node.js):

```bash
npm install -g serve
serve pomodoro-timer/dist -l 3000
```

#### С помощью nginx:

```nginx
server {
    listen 80;
    root /path/to/pomodoro-timer/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Переменные окружения

Приложение не использует переменных окружения — никакой дополнительной конфигурации не требуется.

---

## Проверка работоспособности

После запуска убедитесь, что:

- [x] Отображается круговой таймер с отсчётом
- [x] Работают кнопки Старт / Пауза / Сброс
- [x] Настройки циклов и длительности сохраняются
- [x] При окончании периода звучит сигнал
- [x] Переключатель тёмной темы меняет цветовую схему
- [x] Автозапуск следующего периода работает при включённой опции

---

## Технологии

| Технология | Версия |
|---|---|
| React | 19 |
| TypeScript | 5.9 |
| Vite | 8 |
| Шрифт | Orbitron (Google Fonts) |

---

## Известные особенности

- **Звук**: браузер может блокировать автовоспроизведение звука до первого взаимодействия пользователя со страницей. Это стандартное поведение браузеров.
- **Google Fonts**: для корректного отображения шрифта Orbitron требуется подключение к интернету. В оффлайн-режиме используется системный моноширинный шрифт.
