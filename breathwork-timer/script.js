'use strict';

// ─── Техники дыхания ──────────────────────────────────────────────────────────
const TECHS = [
  {
    id: '478',
    name: '4 — 7 — 8',
    tag: 'Расслабление',
    desc: 'Успокаивает нервную систему и снижает тревогу за несколько минут. Метод доктора Эндрю Вейла.',
    defCycles: 4,
    phases: [
      { name: 'Вдох',     dur: 4,  freq: 528, type: 'inh' },
      { name: 'Задержка', dur: 7,  freq: 396, type: 'hld' },
      { name: 'Выдох',    dur: 8,  freq: 285, type: 'exh' }
    ]
  },
  {
    id: 'box',
    name: 'Box Breathing',
    tag: 'Фокус',
    desc: 'Техника спецназа: четыре фазы по 4с. Быстро снимает стресс и восстанавливает концентрацию.',
    defCycles: 4,
    phases: [
      { name: 'Вдох',     dur: 4, freq: 528, type: 'inh' },
      { name: 'Задержка', dur: 4, freq: 396, type: 'hld' },
      { name: 'Выдох',    dur: 4, freq: 285, type: 'exh' },
      { name: 'Пауза',    dur: 4, freq: 396, type: 'hld' }
    ]
  },
  {
    id: 'wimhof',
    name: 'Wim Hof',
    tag: 'Энергия',
    desc: '30 силовых дыхательных циклов для энергии и иммунитета. После сессии задержи дыхание на 60–90 секунд.',
    defCycles: 30,
    phases: [
      { name: 'Вдох',  dur: 2, freq: 528, type: 'inh' },
      { name: 'Выдох', dur: 2, freq: 285, type: 'exh' }
    ]
  },
  {
    id: 'sigh',
    name: 'Физ. вздох',
    tag: 'Антистресс',
    desc: 'Самый быстрый антистресс. Полный вдох носом + долгий выдох ртом — снижает ЧСС за секунды.',
    defCycles: 5,
    phases: [
      { name: 'Вдох',  dur: 3, freq: 528, type: 'inh' },
      { name: 'Выдох', dur: 6, freq: 285, type: 'exh' }
    ]
  },
  {
    id: 'custom',
    name: 'Свои',
    tag: 'Кастом',
    desc: 'Задай длительность каждой фазы самостоятельно.',
    defCycles: 5,
    phases: [],
    isCustom: true
  }
];

// ─── Цвета фаз (r, g, b) ──────────────────────────────────────────────────────
const COLORS = {
  inh: { r: 79,  g: 195, b: 247 },  // cyan
  hld: { r: 167, g: 139, b: 250 },  // violet
  exh: { r: 52,  g: 211, b: 153 }   // emerald
};

const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;
const rgb  = c      => `rgb(${c.r},${c.g},${c.b})`;

// Длина окружности SVG-ринга (r=118)
const CIRC = 2 * Math.PI * 118;

// ─── Состояние ────────────────────────────────────────────────────────────────
let techId   = '478';
let cycles   = 4;
let muted    = false;
let running  = false;

// Переменные сессии
let phases   = [];
let pIdx     = 0;
let curCyc   = 1;
let rafId    = null;
let audioCtx = null;
let oscNodes = [];    // отслеживаем активные осцилляторы
let orbScale = 0.78;  // текущий масштаб орба

// ─── DOM-ссылки ───────────────────────────────────────────────────────────────
const el = id => document.getElementById(id);

const orbEl    = el('orb');
const rfgEl    = el('rfg');
const pnameEl  = el('pname');
const ptimerEl = el('ptimer');
const ccycEl   = el('ccyc');
const tcycEl   = el('tcyc');
const cycNEl   = el('cyc-n');
const cpanel   = el('cpanel');

// Инициализируем SVG-ринг как пустой
rfgEl.style.strokeDasharray  = CIRC;
rfgEl.style.strokeDashoffset = CIRC;

// ─── Старт ────────────────────────────────────────────────────────────────────
function init() {
  buildPills();
  selectTech(techId);

  el('dec').addEventListener('click',     () => adjustCycles(-1));
  el('inc').addEventListener('click',     () => adjustCycles(+1));
  el('startBtn').addEventListener('click', startSession);
  el('stopBtn').addEventListener('click',  stopSession);
  el('againBtn').addEventListener('click', () => showScreen('idle'));
  el('muteBtn').addEventListener('click',  toggleMute);
}

// ─── Пиллюли выбора техники ───────────────────────────────────────────────────
function buildPills() {
  const wrap = el('pills');
  TECHS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.textContent = t.name;
    btn.dataset.id = t.id;
    btn.addEventListener('click', () => selectTech(t.id));
    wrap.appendChild(btn);
  });
}

function selectTech(id) {
  techId = id;
  const t = getTech(id);
  cycles = t.defCycles;
  cycNEl.textContent = cycles;

  document.querySelectorAll('.pill').forEach(p =>
    p.classList.toggle('on', p.dataset.id === id)
  );

  renderCard(t);
  cpanel.hidden = !t.isCustom;
}

function renderCard(t) {
  const tags = t.phases.map(p => {
    const cls = p.type === 'inh' ? 'inh' : p.type === 'hld' ? 'hld' : 'exh';
    return `<span class="pbadge ${cls}">${p.name} ${p.dur}с</span>`;
  }).join('');

  el('card').innerHTML = `
    <div class="card-name">${t.name}</div>
    <span class="card-badge">${t.tag}</span>
    <p class="card-desc">${t.desc}</p>
    ${tags ? `<div class="card-phases">${tags}</div>` : ''}
  `;
}

// ─── Счётчик циклов ───────────────────────────────────────────────────────────
function adjustCycles(delta) {
  cycles = Math.max(1, Math.min(99, cycles + delta));
  cycNEl.textContent = cycles;
}

// ─── Управление сессией ───────────────────────────────────────────────────────
function startSession() {
  // AudioContext создаём здесь — внутри user gesture (требование iOS Safari)
  if (!muted && !audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { /* audio недоступен — продолжаем без звука */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const t = getTech(techId);
  phases = t.isCustom ? buildCustomPhases() : [...t.phases];

  if (!phases.length) {
    alert('Задай хотя бы вдох и выдох.');
    return;
  }

  pIdx    = 0;
  curCyc  = 1;
  running = true;

  tcycEl.textContent = cycles;
  showScreen('running');
  initOrb();
  runPhase();
}

function runPhase() {
  if (!running) return;

  const phase = phases[pIdx];
  if (!phase || phase.dur <= 0) { advance(); return; }

  // Обновляем UI
  pnameEl.textContent  = phase.name;
  ptimerEl.textContent = phase.dur;
  ccycEl.textContent   = curCyc;

  // Анимируем орб и обновляем цвет ринга
  animateOrb(phase);
  rfgEl.style.stroke = rgb(COLORS[phase.type]);

  // Играем тон
  if (!muted && audioCtx) playTone(phase.freq, phase.dur);

  // RAF: одновременно анимируем ринг и обновляем обратный отсчёт
  rfgEl.style.strokeDashoffset = CIRC;
  cancelAnimationFrame(rafId);

  const start = performance.now();
  const durMs = phase.dur * 1000;

  function tick(now) {
    if (!running) return;

    const progress = Math.min((now - start) / durMs, 1);
    rfgEl.style.strokeDashoffset = CIRC * (1 - progress);

    // Обратный отсчёт (целых секунд)
    const secsLeft = Math.ceil((start + durMs - now) / 1000);
    ptimerEl.textContent = Math.max(0, secsLeft);

    if (progress >= 1) {
      advance();
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);
}

function advance() {
  if (!running) return;

  pIdx++;
  if (pIdx >= phases.length) {
    pIdx = 0;
    curCyc++;
    if (curCyc > cycles) { endSession(); return; }
  }
  runPhase();
}

function endSession() {
  running = false;
  cancelAnimationFrame(rafId);
  stopAllTones();

  const n = cycles;
  el('done-sub').textContent =
    n + ' ' + pluralRu(n, 'цикл', 'цикла', 'циклов') + ' завершено';
  showScreen('done');
}

function stopSession() {
  running = false;
  cancelAnimationFrame(rafId);
  stopAllTones();
  showScreen('idle');
}

// ─── Анимация орба ────────────────────────────────────────────────────────────

// Сбрасываем орб в исходное состояние перед сессией
function initOrb() {
  orbEl.style.transition = 'none';
  orbEl.style.transform  = 'scale(0.78)';
  orbScale = 0.78;
  void orbEl.offsetHeight; // принудительный reflow
}

// Обновляем цвет и масштаб орба в зависимости от фазы
function animateOrb(phase) {
  const c = COLORS[phase.type];

  // Цвет (переход через CSS transition)
  orbEl.style.background  = `radial-gradient(circle at 40% 38%, ${rgba(c, .22)} 0%, ${rgba(c, .03)} 70%)`;
  orbEl.style.borderColor = rgba(c, .32);
  orbEl.style.boxShadow   = `0 0 60px ${rgba(c, .1)}, inset 0 0 35px ${rgba(c, .04)}`;
  ptimerEl.style.color    = rgb(c);

  // Масштаб: вдох → увеличиваем, выдох → уменьшаем, задержка → не меняем
  let target = orbScale;
  if (phase.type === 'inh') target = 1.28;
  if (phase.type === 'exh') target = 0.78;

  if (target !== orbScale) {
    orbEl.style.transition = `transform ${phase.dur}s ease-in-out, background .4s, border-color .4s, box-shadow .4s`;
    orbEl.style.transform  = `scale(${target})`;
    orbScale = target;
  } else {
    // Задержка: только цвет меняется
    orbEl.style.transition = 'background .4s, border-color .4s, box-shadow .4s';
  }
}

// ─── Web Audio API ────────────────────────────────────────────────────────────

// Плавный тон: fade in → sustain → fade out
function playTone(freq, durSecs) {
  if (!audioCtx) return;
  try {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.value = freq;

    const t    = audioCtx.currentTime;
    const fade = 0.08;
    const vol  = 0.11;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + fade);
    gain.gain.setValueAtTime(vol, t + durSecs - fade);
    gain.gain.linearRampToValueAtTime(0, t + durSecs);

    osc.start(t);
    osc.stop(t + durSecs);
    oscNodes.push(osc);
    osc.onended = () => {
      const idx = oscNodes.indexOf(osc);
      if (idx !== -1) oscNodes.splice(idx, 1);
    };
  } catch (e) { /* не критично */ }
}

function stopAllTones() {
  oscNodes.forEach(o => { try { o.stop(0); } catch (e) {} });
  oscNodes = [];
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  el(id).classList.add('active');
}

function getTech(id) {
  return TECHS.find(t => t.id === id) || TECHS[0];
}

// Собираем фазы из пользовательских инпутов
function buildCustomPhases() {
  const n = id => Math.max(0, parseInt(el(id).value) || 0);
  const inh  = n('ci');
  const hld1 = n('ch1');
  const exh  = n('ce');
  const hld2 = n('ch2');

  const ps = [];
  if (inh  > 0) ps.push({ name: 'Вдох',     dur: inh,  freq: 528, type: 'inh' });
  if (hld1 > 0) ps.push({ name: 'Задержка', dur: hld1, freq: 396, type: 'hld' });
  if (exh  > 0) ps.push({ name: 'Выдох',    dur: exh,  freq: 285, type: 'exh' });
  if (hld2 > 0) ps.push({ name: 'Пауза',    dur: hld2, freq: 396, type: 'hld' });
  return ps;
}

function toggleMute() {
  muted = !muted;
  if (muted) stopAllTones();
  const btn = el('muteBtn');
  btn.classList.toggle('sound-off', muted);
  btn.title = muted ? 'Включить звук' : 'Выключить звук';
}

// Склонение существительных для русских чисел
function pluralRu(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// ─── Запуск ───────────────────────────────────────────────────────────────────
init();
