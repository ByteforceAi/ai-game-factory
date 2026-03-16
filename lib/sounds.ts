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

/** Short mechanical click for code typing */
export function playTick() {
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

/** Glitch/error buzz */
export function playGlitch() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 180;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.04, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.15);
  } catch {}
}

/** Whoosh — filtered noise sweep for transitions */
export function playWhoosh() {
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

/* ============================================
   AMBIENT DRONE — for code generation phase
   ============================================ */
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export function playAmbient() {
  try {
    const c = getCtx();
    if (ambientGain) return; // already playing

    ambientGain = c.createGain();
    ambientGain.gain.setValueAtTime(0, c.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.06, c.currentTime + 2);
    ambientGain.connect(c.destination);

    // Deep pad drone
    ambientOsc1 = c.createOscillator();
    ambientOsc1.type = 'sine';
    ambientOsc1.frequency.setValueAtTime(55, c.currentTime);
    ambientOsc1.frequency.linearRampToValueAtTime(58, c.currentTime + 20);
    ambientOsc1.frequency.linearRampToValueAtTime(52, c.currentTime + 40);
    ambientOsc1.connect(ambientGain);
    ambientOsc1.start();

    // Ethereal high shimmer
    ambientOsc2 = c.createOscillator();
    ambientOsc2.type = 'triangle';
    ambientOsc2.frequency.setValueAtTime(440, c.currentTime);
    ambientOsc2.frequency.linearRampToValueAtTime(466, c.currentTime + 15);
    ambientOsc2.frequency.linearRampToValueAtTime(415, c.currentTime + 30);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, c.currentTime);
    filter.Q.setValueAtTime(5, c.currentTime);

    const shimmerGain = c.createGain();
    shimmerGain.gain.setValueAtTime(0.02, c.currentTime);

    ambientOsc2.connect(filter);
    filter.connect(shimmerGain);
    shimmerGain.connect(ambientGain);
    ambientOsc2.start();
  } catch {}
}

export function stopAmbient() {
  try {
    const c = getCtx();
    if (!ambientGain) return;

    ambientGain.gain.linearRampToValueAtTime(0.001, c.currentTime + 1.5);

    const osc1 = ambientOsc1;
    const osc2 = ambientOsc2;
    ambientOsc1 = null;
    ambientOsc2 = null;
    ambientGain = null;

    setTimeout(() => {
      try { osc1?.stop(); } catch {}
      try { osc2?.stop(); } catch {}
    }, 1600);
  } catch {}
}

/** Chip select click — crisp pop */
export function playSelect() {
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
