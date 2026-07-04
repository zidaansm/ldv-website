// Web Audio API Synthesizer for UI Sounds
// Zero dependencies, instantly generated

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  // @ts-ignore
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  return new AudioContext();
};

let audioCtx: AudioContext | null = null;

// Initialize context lazily on first user interaction if needed
const initCtx = () => {
  if (!audioCtx) audioCtx = getAudioContext();
  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Play a sharp, tactile "click" sound.
 * Matches Neobrutalism: Raw, mechanical, immediate.
 */
export const playClick = () => {
  const ctx = initCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // A quick triangle wave sweep downwards
  osc.type = "triangle";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

/**
 * Play a bubbly "pop" sound.
 * Perfect for Likes and playful interactions.
 */
export const playPop = () => {
  const ctx = initCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Sine wave pitch sliding up quickly
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

/**
 * Play a distinct "ding" notification sound.
 * Matches Neobrutalism: Slightly retro/8-bit inspired bell.
 */
export const playDing = () => {
  const ctx = initCtx();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  // Square waves give that retro 8-bit feel
  osc1.type = "square";
  osc1.frequency.setValueAtTime(783.99, ctx.currentTime); // G5

  osc2.type = "square";
  osc2.frequency.setValueAtTime(987.77, ctx.currentTime); // B5

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02); // Quick attack
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // Decay

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.5);
  osc2.stop(ctx.currentTime + 0.5);
};
