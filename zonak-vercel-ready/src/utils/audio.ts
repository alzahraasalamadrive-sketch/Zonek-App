import { NotificationSound } from '../types/zonak';

let audioCtx: AudioContext | null = null;
let ambientNodes: {
  gain: GainNode;
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
} | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playNotificationSound(sound: NotificationSound): void {
  if (sound === 'gentle_vibe') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([35, 45, 35]);
    }
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (sound === 'tea_chime') {
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.9);
    });
  } else if (sound === 'soft_guitar') {
    const chord = [293.66, 369.99, 440.0, 587.33];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + idx * 0.06);
      filter.frequency.exponentialRampToValueAtTime(420, now + idx * 0.06 + 1.2);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.3);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.35);
    });
  }
}

export function startAmbientCalmSound(): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ambientNodes) return true;

  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.04;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(480, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.8);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  ambientNodes = { source, filter, gain };
  return true;
}

export function stopAmbientCalmSound(): void {
  if (!ambientNodes || !audioCtx) return;
  const { gain, source } = ambientNodes;
  const now = audioCtx.currentTime;
  try {
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    setTimeout(() => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore already stopped
      }
    }, 300);
  } catch {
    // ignore
  }
  ambientNodes = null;
}
