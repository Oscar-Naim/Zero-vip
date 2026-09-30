// Synthesizer Web Audio API for Cyber Tactile Sound FX
// Zero external audio files required. Completely client-side.

let audioCtx: AudioContext | null = null;
let soundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleSound(): boolean {
  soundMuted = !soundMuted;
  return !soundMuted;
}

export function isSoundMuted(): boolean {
  return soundMuted;
}

export function playCyberBeep(frequency = 800, type: OscillatorType = 'sine', duration = 0.08) {
  if (soundMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio permission restrictions
  }
}

export function playSuccessChime() {
  playCyberBeep(587.33, 'triangle', 0.06);
  setTimeout(() => playCyberBeep(880, 'triangle', 0.12), 60);
}

export function playAlertWarning() {
  playCyberBeep(280, 'sawtooth', 0.1);
  setTimeout(() => playCyberBeep(240, 'sawtooth', 0.15), 80);
}
