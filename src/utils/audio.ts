let audioContext: AudioContext | null = null;

function context() {
  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

export function playTone(kind: "open" | "pop" | "final") {
  const ctx = context();
  const now = ctx.currentTime;
  const notes = kind === "final" ? [523, 659, 784] : [kind === "open" ? 392 : 180];
  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = kind === "pop" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
    gain.gain.setValueAtTime(0.0001, now + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.09, now + index * 0.09 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.28);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + index * 0.09);
    oscillator.stop(now + index * 0.09 + 0.3);
  });
}

export function startAmbient() {
  const ctx = context();
  const gain = ctx.createGain();
  gain.gain.value = 0.018;
  gain.connect(ctx.destination);
  const oscillators = [174.61, 220, 261.63].map((frequency) => {
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start();
    return oscillator;
  });
  return () => {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    oscillators.forEach((oscillator) => oscillator.stop(ctx.currentTime + 0.3));
  };
}