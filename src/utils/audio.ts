let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  audioContext ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function context() {
  return getAudioContext();
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

/**
 * Soft breath/whoosh sound when an individual candle is blown out
 */
export function playPuffSound() {
  try {
    const ctx = context();
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
  } catch (err) {
    console.error("Audio puff error", err);
  }
}

/**
 * Synthesizes a sweet, music-box / chime style "Happy Birthday" melody using Web Audio API oscillators.
 * Returns an object with a stop() handle.
 */
export function playHappyBirthdayMelody(onEnd?: () => void): { stop: () => void; isPlaying: () => boolean } {
  try {
    const ctx = context();
    let isStopped = false;
    const now = ctx.currentTime + 0.08;

    const BEAT = 0.44;
    const notes: Array<[number, number]> = [
      [392.00, 0.75], [392.00, 0.25], [440.00, 1.0], [392.00, 1.0], [523.25, 1.0], [493.88, 1.8],
      [392.00, 0.75], [392.00, 0.25], [440.00, 1.0], [392.00, 1.0], [587.33, 1.0], [523.25, 1.8],
      [392.00, 0.75], [392.00, 0.25], [783.99, 1.0], [659.25, 1.0], [523.25, 1.0], [493.88, 1.0], [440.00, 1.8],
      [698.46, 0.75], [698.46, 0.25], [659.25, 1.0], [523.25, 1.0], [587.33, 1.0], [523.25, 2.4],
    ];

    const activeOscillators: OscillatorNode[] = [];
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.13, now);
    masterGain.connect(ctx.destination);

    let currentTime = now;

    notes.forEach(([freq, duration]) => {
      const noteDuration = duration * BEAT;

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2, currentTime);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, currentTime);
      noteGain.gain.linearRampToValueAtTime(0.24, currentTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, currentTime + noteDuration * 0.95);

      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.035, currentTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, currentTime + noteDuration * 0.6);

      osc1.connect(noteGain).connect(masterGain);
      osc2.connect(harmonicGain).connect(noteGain);

      osc1.start(currentTime);
      osc1.stop(currentTime + noteDuration);
      osc2.start(currentTime);
      osc2.stop(currentTime + noteDuration);

      activeOscillators.push(osc1, osc2);
      currentTime += noteDuration;
    });

    const totalDuration = currentTime - now;
    const timeoutId = window.setTimeout(() => {
      if (!isStopped && onEnd) onEnd();
    }, totalDuration * 1000);

    const stop = () => {
      isStopped = true;
      window.clearTimeout(timeoutId);
      try {
        masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        setTimeout(() => {
          activeOscillators.forEach(osc => {
            try { osc.stop(); } catch {}
          });
        }, 100);
      } catch {}
    };

    return {
      stop,
      isPlaying: () => !isStopped,
    };
  } catch (err) {
    console.error("Melody error", err);
    return { stop: () => {}, isPlaying: () => false };
  }
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
