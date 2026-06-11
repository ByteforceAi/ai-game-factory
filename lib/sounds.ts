'use client';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Initialize audio context — call on first user interaction */
export function initAudio() {
  getCtx();
}

// ── 음소거 — 교실에서 30대가 동시에 울리면 수업이 무너진다 ──
// localStorage 접근은 SSR 크래시 방지를 위해 호출 시점에 지연 로드
let muted = false;
let mutedLoaded = false;

function loadMuted() {
  if (mutedLoaded) return;
  mutedLoaded = true;
  try { muted = localStorage.getItem('vibe-muted') === '1'; } catch {}
}

export function isMuted(): boolean {
  loadMuted();
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  mutedLoaded = true;
  try { localStorage.setItem('vibe-muted', m ? '1' : '0'); } catch {}
}

function silenced(): boolean {
  loadMuted();
  return muted;
}

/** Short mechanical click for code typing */
export function playTick() {
  if (silenced()) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 800 + Math.random() * 600;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.02, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.04);
  } catch {}
}

/** Analysis step ping — clean sine tone */
export function playPing() {
  if (silenced()) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 1200;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.15);
  } catch {}
}

/** Completion chord — C-E-G ascending */
export function playComplete() {
  if (silenced()) return;
  try {
    const c = getCtx();
    [523, 659, 784].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = c.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {}
}

/** Whoosh — filtered noise sweep for transitions */
export function playWhoosh() {
  if (silenced()) return;
  try {
    const c = getCtx();
    const len = c.sampleRate * 0.25;
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.7;
    const gain = c.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    filter.frequency.linearRampToValueAtTime(3000, c.currentTime + 0.12);
    filter.frequency.linearRampToValueAtTime(400, c.currentTime + 0.25);
    src.start(c.currentTime);
  } catch {}
}

/** Chip select click — crisp pop */
export function playSelect() {
  if (silenced()) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, c.currentTime + 0.06);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.07, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.08);
  } catch {}
}
