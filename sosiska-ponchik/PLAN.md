# Plan: Sausage Runner 3D — Конвертация в Three.js

## Итоговый стек

- **3D движок:** Three.js r175 (ES module via jsDelivr CDN + importmap)
- **Рендерер:** THREE.WebGLRenderer
- **Камера:** THREE.PerspectiveCamera, следует за игроком (позади и выше)
- **Физика:** Ручная, как и раньше (gravity, lerp, velocityY) — только в 3D координатах
- **HUD:** HTML `<div>` overlay с `position:absolute` поверх canvas
- **Звук:** Web Audio API — без изменений
- **Хранение:** localStorage — без изменений
- **Сборка:** Один файл `index.html` — без изменений

---

## Что меняется / что остаётся

| Компонент | Было (2D) | Станет (3D) |
|-----------|-----------|-------------|
| Рендеринг | Canvas 2D ctx | THREE.WebGLRenderer |
| Камера | фиксированная сверху | PerspectiveCamera за персонажем |
| Координаты | X/Y в пикселях | X (линии), Y (высота), Z (движение мира) |
| Сосиска | ctx.arc капсула | THREE.CylinderGeometry |
| Пончик | ctx.arc кольцо | THREE.TorusGeometry |
| Бустеры | ctx.arc круг | THREE.SphereGeometry |
| Дорожка | ctx.fillRect с dividers | THREE.PlaneGeometry + Lane-линии |
| Фон | ctx gradient + здания | CSS background + BoxGeometry здания |
| Частицы | 2D Particle class | THREE.Points (BufferGeometry) |
| Экранный flash | ctx.fillRect overlay | HTML div overlay opacity |
| Screen shake | canvas translate | camera.position jitter |
| HUD | ctx.fillText | HTML `<div>` элементы |
| Звук | Web Audio API | Web Audio API (без изменений) |
| Логика игры | Game state машина | Без изменений |
| Ввод | keyboard/touch | Без изменений |
| localStorage | Рекорд | Без изменений |

---

## Архитектура кода

```
index.html
├── <head>
│   ├── <style> — body, #hud, #flash, кнопки
│   └── <script type="importmap"> — Three.js CDN
├── <body>
│   ├── <canvas id="gc"> — Three.js рендерер займёт весь экран
│   ├── <div id="hud"> — HTML HUD (score, lives, speed, boosters)
│   ├── <div id="flash"> — screen flash overlay
│   └── <script type="module">
│       ├── [A] Three.js импорты
│       ├── [B] КОНСТАНТЫ (3D единицы вместо пикселей)
│       ├── [C] УТИЛИТЫ (lerp, clamp, rand — без изменений)
│       ├── [D] ЗВУК (SND — без изменений)
│       ├── [E] THREE.js SETUP (scene, camera, renderer, lights)
│       ├── [F] ОБЪЕКТЫ СЦЕНЫ (Track, Buildings, SkyGradient)
│       ├── [G] КЛАСС Sausage3D (CylinderGeometry, движение X/Y)
│       ├── [H] КЛАСС Donut3D (TorusGeometry, движение по Z)
│       ├── [I] КЛАСС Booster3D (SphereGeometry, движение по Z)
│       ├── [J] КЛАСС ParticleSystem3D (THREE.Points)
│       ├── [K] HUD (обновление HTML-элементов)
│       ├── [L] SCREEN FX (flash div, shake camera)
│       ├── [M] GAME LOGIC (startGame, doSuccess, doMiss, endGame — аналогично 2D)
│       ├── [N] INPUT (keyboard/touch — без изменений)
│       ├── [O] UPDATE (game loop логика — координаты переработаны под 3D)
│       └── [P] GAME LOOP (renderer.render вместо ctx draw)
```

---

## Three.js сцена: координатная система

```
Ось X: -2.5 | 0 | 2.5  (три линии, ширина дорожки ~6 units)
Ось Y: 0 (земля), +1..+5 (прыжок), +5 (камера смещение)
Ось Z: 0 (игрок стоит), препятствия движутся от +50 к -∞

Движение мира: player.position.z = const (0)
               obstacles.position.z -= speed * dt

Камера: position = (player.x, player.y + 5, -10)
        lookAt   = (player.x, player.y + 1, +5)
```

---

## Константы в 3D единицах

```javascript
const LANES_X    = [-2.5, 0, 2.5];   // позиции трёх линий по X
const GROUND_Y   = 0;                 // уровень земли
const JUMP_V0    = 12;                // начальная вертикальная скорость прыжка (units/s)
const GRAVITY    = 28;                // гравитация (units/s²)
const INIT_SPD   = 8;                 // начальная скорость движения мира (units/s)
const MAX_SPD    = 22;                // максимальная скорость
const SPD_RATE   = 0.4;              // прирост скорости (units/s²)
const SPAWN_Z    = 55;               // дистанция спавна пончиков (по Z)
const DESPAWN_Z  = -8;               // удаление объектов за игроком
```

---

## Геометрии объектов

| Объект | Геометрия | Размеры | Материал |
|--------|-----------|---------|----------|
| Сосиска | CylinderGeometry | r=0.28, h=1.0, segments=10 | MeshPhongMaterial, цвет #c45c2a |
| Пончик | TorusGeometry | radius=1.1, tube=0.4, seg=16/24 | MeshPhongMaterial, цвет случайный |
| Бустер | SphereGeometry | r=0.4, seg=12 | MeshPhongMaterial, glow |
| Дорожка | PlaneGeometry | w=7, h=200, повёрнута -90° X | MeshPhongMaterial, тёмный |
| Здания | BoxGeometry | случайные размеры | MeshLambertMaterial |

---

## Коллизии пончика (Torus hitbox)

TorusGeometry даёт сложный hitbox. Решение — invisible helper:

```javascript
class Donut3D {
  constructor() {
    // Видимый тор
    this.mesh = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.4, 16, 24), mat);
    // Невидимый Box3 для "дырки" (внутреннее пространство тора)
    // Hole zone: x от -0.65 до +0.65, y от -0.65 до +0.65, z от -0.5 до +0.5
    this.holeBox = new THREE.Box3();
    // Outer box (для определения столкновения с телом)
    this.outerBox = new THREE.Box3();
  }

  update(dt) {
    this.mesh.position.z -= speed * dt;
    // Обновить holeBox и outerBox вокруг mesh.position
    const p = this.mesh.position;
    this.holeBox.set(
      new THREE.Vector3(p.x - 0.65, p.y - 0.65, p.z - 0.5),
      new THREE.Vector3(p.x + 0.65, p.y + 0.65, p.z + 0.5)
    );
    this.outerBox.setFromObject(this.mesh);
  }
}

// Коллизия:
const playerBox = new THREE.Box3().setFromObject(player.mesh);
if (playerBox.intersectsBox(donut.holeBox)) {
  // SUCCESS — попал в дырку
} else if (playerBox.intersectsBox(donut.outerBox)) {
  // MISS — врезался в тело пончика
}
```

---

## HUD: HTML overlay

Вместо ctx.fillText — HTML div:

```html
<div id="hud">
  <div id="hud-lives">♥ ♥ ♥</div>
  <div id="hud-score">0</div>
  <div id="hud-hi">РЕКОРД: 0</div>
  <div id="hud-speed-bar"><div id="hud-speed-fill"></div></div>
  <div id="hud-boosters"></div>
  <div id="hud-combo"></div>
  <div id="hud-jump-hint"></div>
</div>
<div id="flash"></div>   <!-- screen flash overlay -->
<div id="overlay"></div> <!-- title/gameover/pause экраны -->
```

Обновление из JS: `document.getElementById('hud-score').textContent = score;`

---

## Screen FX в 3D

```javascript
// Screen flash: меняем opacity у #flash div
const flashDiv = document.getElementById('flash');
function screenFlash(color, alpha) {
  flashDiv.style.background = color;
  flashDiv.style.opacity = alpha;
  // Затухание через CSS transition или в game loop
}

// Screen shake: смещаем camera.position
let shakeT = 0;
function applyShake(dt) {
  if (shakeT > 0) {
    shakeT -= dt;
    camera.position.x += (Math.random() - 0.5) * 0.3;
    camera.position.y += (Math.random() - 0.5) * 0.2;
  }
}
```

---

## Система частиц в 3D

```javascript
class ParticleSystem3D {
  constructor() {
    this.particles = []; // массив { mesh, vx, vy, vz, life, decay }
  }

  emit(x, y, z, count, colorHex) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 8 + 2,
        vz: (Math.random() - 0.5) * 3,
        life: 1, decay: Math.random() * 1.5 + 0.8
      });
    }
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 15 * dt; // gravity
      p.life -= p.decay * dt;
      p.mesh.material.opacity = Math.max(0, p.life);
      if (p.life <= 0) { scene.remove(p.mesh); return false; }
      return true;
    });
  }
}
```

---

## Дорожка и окружение

```javascript
// Основная дорожка
const trackGeo = new THREE.PlaneGeometry(7, 300);
const trackMat = new THREE.MeshPhongMaterial({ color: 0x0e0720, shininess: 10 });
const track = new THREE.Mesh(trackGeo, trackMat);
track.rotation.x = -Math.PI / 2;
track.position.set(0, -0.01, 80); // центрируется впереди
scene.add(track);

// Линии разметки (два узких прямоугольника по X = ±1.25)
[-1.25, 1.25].forEach(x => {
  const lineGeo = new THREE.PlaneGeometry(0.04, 300);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x5a3cb4, transparent: true, opacity: 0.5 });
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.rotation.x = -Math.PI / 2;
  line.position.set(x, 0, 80);
  scene.add(line);
});

// Боковые неоновые края
[-3.5, 3.5].forEach(x => {
  const edgeGeo = new THREE.BoxGeometry(0.06, 0.1, 300);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x7846fa });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.position.set(x, 0, 80);
  scene.add(edge);
});
```

---

## Освещение

```javascript
// Ambient (общий мягкий свет)
const hemi = new THREE.HemisphereLight(0x2a1060, 0x0a0420, 0.8);
scene.add(hemi);

// Направленный (имитация солнца/луны)
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(5, 10, -5);
scene.add(dir);

// Fog для глубины и скрытия краёв дорожки
scene.fog = new THREE.Fog(0x040412, 30, 80);
```

---

## Анимация сосиски

В 3D сосиска:
- Стоит вертикально: `rotation.x = 0`
- Переворачивается при прыжке сквозь пончик: `rotation.x` → `Math.PI/2` (lerp)
- Покачивание при беге: `mesh.position.y += Math.sin(runT * 11) * 0.06`
- Squash & stretch: `mesh.scale.set(sqX, sqY, sqX)` при прыжке/приземлении

---

## Шаги реализации (для developer агента)

### Шаг 1: Подготовка структуры
- Создать новый `index.html` на основе существующего
- Добавить `<script type="importmap">` для Three.js r175
- Изменить `<script>` на `<script type="module">`
- Убрать `<canvas id="gc">` и создать `<div id="app">` под Three.js renderer
- Добавить HTML HUD overlay структуру

### Шаг 2: Three.js инициализация
- Import THREE
- Создать Scene, PerspectiveCamera (FOV 65), WebGLRenderer
- Renderer: fullscreen, антиалиасинг, тёмный цвет фона (#040412)
- Добавить освещение (HemisphereLight + DirectionalLight)
- Добавить Fog
- Resize handler

### Шаг 3: Дорожка и окружение
- PlaneGeometry дорожка (7×300)
- Линии разметки (2 узких прямоугольника)
- Неоновые края (2 BoxGeometry)
- Задний фон: здания из BoxGeometry по бокам
- Scrolling: здания переиспользуются (pooling) как пончики

### Шаг 4: Класс Sausage3D
- CylinderGeometry(0.28, 0.32, 1.0, 10) + MeshPhongMaterial
- Метод tryJump, tryLane — логика та же
- update(): lerp по X, физика по Y
- Анимация rotation.x при throughHole
- Squash scale при прыжке/приземлении
- Shield aura: wireframe sphere вокруг
- Mini booster: scale.multiplyScalar(0.6)

### Шаг 5: Класс Donut3D
- TorusGeometry(1.1, 0.4, 16, 24)
- Random icing color через MeshPhongMaterial
- holeBox: THREE.Box3 (статичная inner zone)
- outerBox: THREE.Box3().setFromObject(mesh)
- Анимация: rotation.z += wobble * dt
- Warning: emissive цвет нарастает при приближении к игроку

### Шаг 6: Класс Booster3D
- SphereGeometry(0.4, 12, 12) + цвет по типу
- Bobbing: позиция Y oscillates
- Spin: rotation.y += dt
- Glow: PointLight вокруг (небольшой)

### Шаг 7: Система частиц ParticleSystem3D
- Пул из SphereGeometry tiny meshes (или Points)
- Emit at world position: confetti (success), hit (miss), boost (booster)
- Gravity + fade out

### Шаг 8: HUD (HTML overlay)
- Обновление через updateHUD() в game loop
- Lives: символы ♥ или icon spans
- Score: большой текст по центру сверху
- Speed bar: div с width в %
- Active boosters: badges с таймерами
- Combo: нижний левый угол
- Jump hint: над игроком (позиция зависит от camera projection)

### Шаг 9: Screen FX
- Flash: opacity transition на #flash div
- Shake: смещение camera.position в update
- Slow-mo border: border на body или overlay div

### Шаг 10: Title / Pause / Game Over экраны
- HTML overlay div (#overlay) с нужным содержимым
- Управление через state machine: показывать/скрывать div
- Кнопка "Играть снова" — click + keyboard

### Шаг 11: Камера и following
```javascript
function updateCamera() {
  const tx = player.mesh.position.x;
  const ty = player.mesh.position.y;
  camera.position.x = lerp(camera.position.x, tx, 0.08); // мягкое следование
  camera.position.y = ty + 5;
  camera.position.z = -10;
  camera.lookAt(tx, ty + 1, 5);
}
```

### Шаг 12: Game loop
- `renderer.render(scene, camera)` вместо canvas draw
- Сохранить всю логику update без изменений
- Скорость: отображать в units/s, конвертировать из старых px/s пропорционально

---

## Контрольный чеклист

- [ ] Three.js загружается без ошибок через importmap
- [ ] Дорожка видна, линии разметки отображаются
- [ ] Сосиска стоит на дорожке, камера следует сзади
- [ ] Переключение линий работает плавно (lerp)
- [ ] Прыжок работает с физикой (гравитация)
- [ ] Пончики едут навстречу по Z
- [ ] Коллизия: попадание в дырку → очки
- [ ] Коллизия: удар о тело → -жизнь
- [ ] Бустеры подбираются при наступании на линию
- [ ] HUD обновляется: score, lives, speed, boosters
- [ ] Звук работает (jump, success, miss, over)
- [ ] Game Over показывается при 0 жизнях
- [ ] Рестарт работает
- [ ] Рекорд сохраняется в localStorage
- [ ] Работает на мобильных (touch swipe)
- [ ] Fog скрывает дальние края дорожки

---

## Примечания

- **Importmap** поддерживается в Chrome 89+, Firefox 108+, Safari 16.4+. Для устаревших браузеров не нужны полифилы — ЦА играет в современных браузерах.
- **Тени (shadows)** отключить (`castShadow = false`) для стабильных 60fps на мобильных.
- **Object pooling** для пончиков: вместо remove/add менять position.z обратно за горизонт при despawn.
- **HUD через HTML** проще и надёжнее, чем рисовать текст поверх Three.js canvas. HTML рендерится браузером нативно.
- **Размытие (bloom/glow)** можно добавить через Three.js PostProcessing (`UnrealBloomPass`) — но это опционально, добавит визуальный wow-эффект для неоновых линий и пончиков.
