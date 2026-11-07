import { motion, useReducedMotion } from "motion/react";
import { Mic, MicOff, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext, playHappyBirthdayMelody, playPuffSound } from "../utils/audio";

/**
 * =========================================================================
 * CONFIGURATION CONSTANTS (Easily tweakable)
 * =========================================================================
 */

/** Default number of candles placed across the cake */
export const DEFAULT_CANDLE_COUNT = 5;

/** Default recipient name if none is provided */
export const DEFAULT_RECIPIENT_NAME = "Birthday Star";

/**
 * Sensitivity threshold for blow detection (RMS amplitude above baseline ambient noise).
 * - Lower values (e.g. 0.030): More sensitive, easier to blow out
 * - Higher values (e.g. 0.070): Less sensitive, requires blowing harder/closer to mic
 */
export const BLOW_SENSITIVITY_THRESHOLD = 0.045;

/** Duration in milliseconds to calibrate ambient room noise before listening for blows */
export const CALIBRATION_DURATION_MS = 1000;

/**
 * Duration in milliseconds the low-frequency sound must stay continuously
 * above threshold to count as a genuine blow (prevents claps, coughs, or clicks)
 */
export const SUSTAINED_BLOW_MS = 320;

/**
 * Low-pass filter frequency in Hz.
 * Blowing directly into a microphone produces wind turbulence with heavy
 * sub-bass energy (< 350Hz), while human speech and claps are much higher.
 */
export const LOWPASS_CUTOFF_HZ = 350;

/** Pastel colors for the 5 candles */
const CANDLE_COLORS = [
  { body: "#F4A7B9", stripe: "#FFF0F5" }, // Rose / Soft Pink
  { body: "#D4BEE4", stripe: "#F8F4FF" }, // Lavender
  { body: "#FAD4C0", stripe: "#FFF8F2" }, // Peach
  { body: "#C1E1C1", stripe: "#F0FFF0" }, // Mint
  { body: "#FDE2B8", stripe: "#FFFDF6" }, // Warm Buttercup
];

export interface BirthdayCakeScreenProps {
  recipientName?: string | undefined;
  senderName?: string | undefined;
  candleCount?: number | undefined;
  onProceed: () => void;
  isReceiver?: boolean | undefined;
  onBackToEditor?: (() => void) | undefined;
}

export function BirthdayCakeScreen({
  recipientName = DEFAULT_RECIPIENT_NAME,
  senderName,
  candleCount = DEFAULT_CANDLE_COUNT,
  onProceed,
  isReceiver = false,
  onBackToEditor,
}: BirthdayCakeScreenProps) {
  const reducedMotion = useReducedMotion();

  // State: lit candles (array of boolean)
  const [candles, setCandles] = useState<boolean[]>(() =>
    Array.from({ length: candleCount }, () => true)
  );

  // Microphone lifecycle states: 'idle' | 'requesting' | 'calibrating' | 'listening' | 'error' | 'blown'
  const [micState, setMicState] = useState<"idle" | "requesting" | "calibrating" | "listening" | "error" | "blown">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [micLevel, setMicLevel] = useState<number>(0); // 0 to 1 for live meter
  const [flameLean, setFlameLean] = useState<number>(0); // -35 to +35 deg
  const [flameFlicker, setFlameFlicker] = useState<number>(1);
  const [musicMuted, setMusicMuted] = useState<boolean>(false);
  const [celebrationStarted, setCelebrationStarted] = useState<boolean>(false);

  // Refs for audio processing
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const blowStartRef = useRef<number>(0);
  const baselineRmsRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationStartTimeRef = useRef<number>(0);
  const melodyHandleRef = useRef<{ stop: () => void; isPlaying: () => boolean } | null>(null);
  const lastExtinguishedTimeRef = useRef<number>(0);

  // Keep candle count synced if prop changes
  useEffect(() => {
    setCandles(Array.from({ length: candleCount }, () => true));
  }, [candleCount]);

  /**
   * Stop and release microphone stream to preserve battery and privacy
   */
  const stopMicrophone = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMicLevel(0);
    setFlameLean(0);
    setFlameFlicker(1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      melodyHandleRef.current?.stop();
    };
  }, [stopMicrophone]);

  /**
   * Trigger celebration fanfare when all candles are blown out
   */
  const triggerCelebration = useCallback(() => {
    setCelebrationStarted(true);
    setMicState("blown");
    stopMicrophone();

    // Start synthesized Happy Birthday melody (if not muted)
    if (!musicMuted) {
      melodyHandleRef.current?.stop();
      melodyHandleRef.current = playHappyBirthdayMelody();
    }
  }, [musicMuted, stopMicrophone]);

  /**
   * Extinguish an individual candle by index (works for both mic and manual tap)
   */
  const extinguishCandle = useCallback((index: number) => {
    playPuffSound();
    setCandles((prev) => {
      const next = [...prev];
      next[index] = false;
      const remaining = next.filter(Boolean).length;
      if (remaining === 0) {
        setTimeout(triggerCelebration, 150);
      }
      return next;
    });
  }, [triggerCelebration]);

  /**
   * Extinguish all remaining lit candles at once (for strong blows or 1-click fallback)
   */
  const extinguishAllCandles = useCallback(() => {
    playPuffSound();
    setCandles((prev) => prev.map(() => false));
    setTimeout(triggerCelebration, 150);
  }, [triggerCelebration]);

  /**
   * Extinguish the next available lit candle (for progressive blowing)
   */
  const extinguishNextLitCandle = useCallback(() => {
    const now = performance.now();
    // Throttle to at most one candle every 220ms unless blow is massive
    if (now - lastExtinguishedTimeRef.current < 220) return;
    lastExtinguishedTimeRef.current = now;

    playPuffSound();
    setCandles((prev) => {
      const firstLit = prev.findIndex((lit) => lit);
      if (firstLit === -1) return prev;
      const next = [...prev];
      next[firstLit] = false;
      const remaining = next.filter(Boolean).length;
      if (remaining === 0) {
        setTimeout(triggerCelebration, 150);
      }
      return next;
    });
  }, [triggerCelebration]);

  /**
   * Request microphone permission and initiate Web Audio blow detection
   */
  const startListening = async () => {
    setMicState("requesting");
    setErrorMessage("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone is not supported in this browser or context.");
      }

      // Check if secure context (mic requires localhost or HTTPS)
      if (window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        throw new Error("Microphone access requires a secure connection (HTTPS or localhost).");
      }

      // Request audio stream with raw inputs (disable echo/noise suppression to preserve wind turbulence)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch {
        // Fallback to basic audio constraint if specific flags rejected
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // Initialize Web Audio Context and pipeline
      const ctx = getAudioContext();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);

      // Low-pass filter to isolate low-frequency breath wind rumble (< 350 Hz)
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = "lowpass";
      lowpassFilter.frequency.setValueAtTime(LOWPASS_CUTOFF_HZ, ctx.currentTime);
      lowpassFilter.Q.setValueAtTime(1.0, ctx.currentTime);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.22;
      analyserRef.current = analyser;

      source.connect(lowpassFilter);
      lowpassFilter.connect(analyser);

      // Start calibration phase
      setMicState("calibrating");
      calibrationStartTimeRef.current = performance.now();
      calibrationSamplesRef.current = [];
      baselineRmsRef.current = 0.015; // default fallback baseline

      const dataArray = new Uint8Array(analyser.fftSize);

      const processAudio = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        // Compute RMS of the low-frequency waveform
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i] ?? 128;
          const norm = (val - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const now = performance.now();

        // 1. Calibration Phase (First ~1000ms)
        if (now - calibrationStartTimeRef.current < CALIBRATION_DURATION_MS) {
          calibrationSamplesRef.current.push(rms);
          const progress = Math.min(1, (now - calibrationStartTimeRef.current) / CALIBRATION_DURATION_MS);
          setMicLevel(progress * 0.2);
          animationFrameRef.current = requestAnimationFrame(processAudio);
          return;
        }

        // Finalize calibration once
        if (calibrationSamplesRef.current.length > 0) {
          const avg =
            calibrationSamplesRef.current.reduce((a, b) => a + b, 0) /
            calibrationSamplesRef.current.length;
          baselineRmsRef.current = Math.max(0.008, avg);
          calibrationSamplesRef.current = [];
          setMicState("listening");
        }

        // 2. Active Listening Phase
        const baseline = baselineRmsRef.current;
        const delta = Math.max(0, rms - baseline);

        // Normalized mic level (0 to 1) for the visual indicator
        const visualLevel = Math.min(1, delta / (BLOW_SENSITIVITY_THRESHOLD * 2.2));
        setMicLevel(visualLevel);

        // Dynamic flame reaction: lean angle and flame flicker proportional to blow strength
        const lean = Math.min(32, (delta / BLOW_SENSITIVITY_THRESHOLD) * 22);
        // Random slight jitter in lean direction to feel like flickering wind
        setFlameLean((Math.random() > 0.4 ? 1 : -1) * lean);
        setFlameFlicker(Math.max(0.4, 1 - visualLevel * 0.55));

        // 3. Sustained blow detection
        if (delta >= BLOW_SENSITIVITY_THRESHOLD) {
          if (blowStartRef.current === 0) {
            blowStartRef.current = now;
          }
          const sustainedDuration = now - blowStartRef.current;

          if (sustainedDuration >= SUSTAINED_BLOW_MS) {
            // If the blow is exceptionally strong (> 2.3x threshold), blow all out at once!
            if (delta >= BLOW_SENSITIVITY_THRESHOLD * 2.3) {
              extinguishAllCandles();
              return;
            } else {
              // Otherwise extinguish candles progressively
              extinguishNextLitCandle();
              // Reset duration slightly so subsequent candles require continued breath
              blowStartRef.current = now - 120;
            }
          }
        } else {
          blowStartRef.current = 0;
        }

        animationFrameRef.current = requestAnimationFrame(processAudio);
      };

      animationFrameRef.current = requestAnimationFrame(processAudio);
    } catch (err: unknown) {
      console.warn("Microphone access failed", err);
      setMicState("error");
      const errStr = String(err);
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        setErrorMessage("Microphone permission was denied. You can still blow out the candles by tapping them!");
      } else if (errStr.includes("secure")) {
        setErrorMessage("Microphone requires HTTPS or localhost. Tap the candles to blow them out!");
      } else {
        setErrorMessage("Microphone unavailable on this device. You can blow out the candles by tapping them!");
      }
    }
  };

  /**
   * Reset / relight all candles to replay
   */
  const handleRelight = () => {
    melodyHandleRef.current?.stop();
    setCelebrationStarted(false);
    setCandles(Array.from({ length: candleCount }, () => true));
    setMicState("idle");
    setMicLevel(0);
    setFlameLean(0);
    setFlameFlicker(1);
  };

  /**
   * Toggle Happy Birthday celebration music
   */
  const toggleMusic = () => {
    if (musicMuted) {
      setMusicMuted(false);
      if (celebrationStarted) {
        melodyHandleRef.current = playHappyBirthdayMelody();
      }
    } else {
      setMusicMuted(true);
      melodyHandleRef.current?.stop();
    }
  };

  const litCount = candles.filter(Boolean).length;
  const allCandlesOut = litCount === 0;

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-4 text-center">
      {/* Sender back-to-editor shortcut */}
      {!isReceiver && onBackToEditor && (
        <div className="w-full flex justify-start pb-2">
          <button
            type="button"
            onClick={onBackToEditor}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream/80 px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink transition-colors"
          >
            ← Back to Card Editor
          </button>
        </div>
      )}

      {/* Confetti Explosion when all candles are blown out */}
      {celebrationStarted && <ConfettiExplosion />}

      {/* Screen Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-deep/20 bg-rose/10 px-4 py-1.5 text-xs font-semibold text-rose-deep backdrop-blur-sm">
          <span>🎂</span>
          <span>{allCandlesOut ? "Wishes Sealed in the Stars" : "Make a Wish & Blow the Candles"}</span>
          <span>✨</span>
        </div>

        <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">
          Happy Birthday, <span className="text-rose-deep">{recipientName}</span>!
        </h1>

        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
          {allCandlesOut ? (
            <span>
              All your wishes are soaring into the sky!
              {senderName ? ` ${senderName} has prepared a personalized surprise for you.` : " Your surprise is ready!"}
            </span>
          ) : (
            <span>
              Close your eyes, make your dearest wish, and blow into your device microphone to extinguish the candles.
            </span>
          )}
        </p>
      </motion.div>

      {/* SVG Birthday Cake & Animated Candles */}
      <div className="relative my-4 flex w-full max-w-[420px] justify-center select-none">
        <svg
          viewBox="0 0 400 360"
          className="w-full h-auto drop-shadow-[0_18px_35px_rgba(222,93,131,0.22)]"
          aria-label="Interactive Birthday Cake"
        >
          <defs>
            {/* Candle flame glow gradient */}
            <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF7CC" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#FFB347" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF5E7E" stopOpacity="0" />
            </radialGradient>

            {/* Candle flame body gradient */}
            <linearGradient id="flameBody" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="35%" stopColor="#FFA040" />
              <stop offset="75%" stopColor="#FFDE59" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Cake stand porcelain gradient */}
            <linearGradient id="platterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#EFE5DC" />
            </linearGradient>

            {/* Bottom sponge layer gradient */}
            <linearGradient id="spongeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF1E8" />
              <stop offset="100%" stopColor="#FED7C7" />
            </linearGradient>

            {/* Strawberry glaze drip gradient */}
            <linearGradient id="glazeDrip" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FA8CA5" />
              <stop offset="100%" stopColor="#DE5D83" />
            </linearGradient>

            {/* Top cake layer gradient */}
            <linearGradient id="spongeTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF5F7" />
              <stop offset="100%" stopColor="#FBD5DE" />
            </linearGradient>
          </defs>

          {/* 1. Cake Pedestal & Platter */}
          <g id="platter">
            {/* Soft shadow under stand */}
            <ellipse cx="200" cy="342" rx="135" ry="14" fill="#E8D5CE" opacity="0.55" />
            {/* Pedestal foot */}
            <path
              d="M 172 310 L 160 334 Q 200 342 240 334 L 228 310 Z"
              fill="url(#platterGrad)"
              stroke="#D6C4B9"
              strokeWidth="1.5"
            />
            {/* Platter bottom curve */}
            <path
              d="M 50 305 Q 200 336 350 305 L 350 295 Q 200 326 50 295 Z"
              fill="#E5D6CC"
            />
            {/* Porcelain platter plate */}
            <ellipse cx="200" cy="296" rx="152" ry="22" fill="url(#platterGrad)" stroke="#E0D1C6" strokeWidth="2" />
            {/* Decorative platter scalloped border ring */}
            <ellipse cx="200" cy="295" rx="146" ry="18" fill="none" stroke="#F4A7B9" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
          </g>

          {/* 2. Cake Bottom Tier */}
          <g id="bottom-tier">
            {/* Cake sponge body */}
            <path
              d="M 85 240 L 85 285 Q 200 316 315 285 L 315 240 Z"
              fill="url(#spongeBottom)"
              stroke="#E8BDAD"
              strokeWidth="1"
            />
            {/* Bottom tier top surface */}
            <ellipse cx="200" cy="240" rx="115" ry="18" fill="#FFF5EC" />

            {/* Dripping strawberry frosting glaze */}
            <path
              d="M 85 240
                 C 95 258, 105 264, 115 252
                 C 125 272, 138 276, 148 250
                 C 158 266, 172 268, 185 248
                 C 195 274, 210 276, 222 250
                 C 232 268, 246 270, 258 248
                 C 270 274, 285 270, 295 252
                 C 305 264, 312 255, 315 240
                 Q 200 258 85 240 Z"
              fill="url(#glazeDrip)"
              opacity="0.92"
            />

            {/* Cream swirls / rosettes along base */}
            {[98, 130, 165, 200, 235, 270, 302].map((x, i) => (
              <g key={`swirl-${i}`} transform={`translate(${x}, ${278 + Math.sin(i * 0.9) * 4})`}>
                <ellipse cx="0" cy="0" rx="9" ry="7" fill="#FFFFFF" opacity="0.95" />
                <path d="M -5 -1 Q 0 -6 5 -1" stroke="#F4A7B9" strokeWidth="1" fill="none" />
              </g>
            ))}
          </g>

          {/* 3. Cake Top Tier */}
          <g id="top-tier">
            {/* Top tier sponge body */}
            <path
              d="M 120 180 L 120 226 Q 200 248 280 226 L 280 180 Z"
              fill="url(#spongeTop)"
              stroke="#F4B8C7"
              strokeWidth="1"
            />
            {/* Top surface of the cake */}
            <ellipse cx="200" cy="180" rx="80" ry="17" fill="#FFF8FA" stroke="#F9C6D3" strokeWidth="1" />

            {/* Dripping frosting on top tier */}
            <path
              d="M 120 180
                 C 128 198, 138 202, 146 190
                 C 156 208, 168 210, 178 190
                 C 188 206, 200 208, 212 189
                 C 222 208, 234 209, 245 189
                 C 255 204, 268 202, 280 180
                 Q 200 196 120 180 Z"
              fill="url(#glazeDrip)"
              opacity="0.95"
            />

            {/* Decorative strawberries on top tier edge */}
            {[135, 165, 200, 235, 265].map((x, i) => {
              const y = 186 + Math.sin((i / 4) * Math.PI) * 8;
              return (
                <g key={`berry-${i}`} transform={`translate(${x}, ${y}) scale(0.68)`}>
                  {/* Strawberry body */}
                  <path d="M 0 0 C -7 0, -8 9, 0 16 C 8 9, 7 0, 0 0 Z" fill="#E63956" />
                  {/* Seeds */}
                  <circle cx="-2" cy="5" r="0.7" fill="#FFE082" />
                  <circle cx="2" cy="7" r="0.7" fill="#FFE082" />
                  <circle cx="0" cy="11" r="0.7" fill="#FFE082" />
                  {/* Green leaves */}
                  <path d="M -5 -2 Q 0 -5 5 -2 Q 0 0 -5 -2 Z" fill="#68B04D" />
                </g>
              );
            })}
          </g>

          {/* 4. Five Lit / Interactive Candles */}
          <g id="candles">
            {candles.map((isLit, i) => {
              // Calculate candle positions along the top cake ellipse
              // Center is cx=200, cy=176, spread horizontally from x=142 to x=258
              const candlePositions = [
                { x: 145, y: 173 },
                { x: 172, y: 178 },
                { x: 200, y: 180 },
                { x: 228, y: 178 },
                { x: 255, y: 173 },
              ];
              const pos = candlePositions[i] || { x: 200, y: 180 };
              const color = CANDLE_COLORS[i % CANDLE_COLORS.length] ?? CANDLE_COLORS[0]!;
              const candleHeight = 44;
              const candleWidth = 7;
              const wickTop = pos.y - candleHeight;

              return (
                <g
                  key={`candle-${i}`}
                  className="cursor-pointer group"
                  onClick={() => extinguishCandle(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Candle ${i + 1}: ${isLit ? "Lit (tap to blow out)" : "Blown out"}`}
                >
                  {/* Invisible enlarged click target for easy tapping on touch screens */}
                  <rect
                    x={pos.x - 14}
                    y={pos.y - candleHeight - 35}
                    width="28"
                    height={candleHeight + 45}
                    fill="transparent"
                  />

                  {/* Candle Stick Body */}
                  <rect
                    x={pos.x - candleWidth / 2}
                    y={pos.y - candleHeight}
                    width={candleWidth}
                    height={candleHeight}
                    rx="3"
                    fill={color.body}
                    stroke="#D99AA9"
                    strokeWidth="0.8"
                  />

                  {/* Decorative diagonal spiral stripes */}
                  <line
                    x1={pos.x - candleWidth / 2}
                    y1={pos.y - candleHeight + 8}
                    x2={pos.x + candleWidth / 2}
                    y2={pos.y - candleHeight + 14}
                    stroke={color.stripe}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={pos.x - candleWidth / 2}
                    y1={pos.y - candleHeight + 20}
                    x2={pos.x + candleWidth / 2}
                    y2={pos.y - candleHeight + 26}
                    stroke={color.stripe}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={pos.x - candleWidth / 2}
                    y1={pos.y - candleHeight + 32}
                    x2={pos.x + candleWidth / 2}
                    y2={pos.y - candleHeight + 38}
                    stroke={color.stripe}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  {/* Candle Wick */}
                  <line
                    x1={pos.x}
                    y1={wickTop}
                    x2={pos.x}
                    y2={wickTop - 6}
                    stroke="#2D1E24"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />

                  {/* FLAME (When Lit) */}
                  {isLit && (
                    <g
                      transform={`translate(${pos.x}, ${wickTop - 6}) rotate(${flameLean}) scale(${flameFlicker})`}
                      style={{
                        transformOrigin: `${pos.x}px ${wickTop - 6}px`,
                        transition: "transform 0.08s ease-out",
                      }}
                    >
                      {/* Outer Radiant Glow */}
                      <circle
                        cx="0"
                        cy="-12"
                        r="18"
                        fill="url(#flameGlow)"
                        className="animate-pulse"
                      />

                      {/* Main Flame Teardrop */}
                      <path
                        d="M 0 0 C -5 -6, -6 -16, 0 -24 C 6 -16, 5 -6, 0 0 Z"
                        fill="url(#flameBody)"
                        filter="drop-shadow(0 0 5px rgba(255, 170, 50, 0.8))"
                      />

                      {/* Inner Bright White/Yellow Core */}
                      <path
                        d="M 0 -2 C -2 -6, -2 -12, 0 -16 C 2 -12, 2 -6, 0 -2 Z"
                        fill="#FFFFEE"
                      />
                    </g>
                  )}

                  {/* SMOKE WISPS (When Blown Out) */}
                  {!isLit && (
                    <g transform={`translate(${pos.x}, ${wickTop - 6})`}>
                      <path
                        d="M 0 0 Q -4 -12, -1 -24 T -3 -46"
                        fill="none"
                        stroke="rgba(140, 130, 135, 0.65)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        className="smoke-wisp"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="1.5"
                        fill="#7A6870"
                        opacity="0.8"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Interactive Controls & Live Mic Feedback */}
      <div className="w-full max-w-md space-y-4 pt-1">
        {/* Case 1: Initial state (Mic not started yet) */}
        {micState === "idle" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={startListening}
              className="focus-ring group w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-rose-deep px-8 py-4 text-base font-bold text-cream shadow-lg shadow-rose/25 transition-all hover:opacity-95 hover:shadow-xl active:scale-95"
            >
              <span>Tap to Start & Make a Wish</span>
              <Mic size={19} className="transition-transform group-hover:scale-110" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-ink-soft">
              <span>(Requires mic permission to detect your breath)</span>
              <span>•</span>
              <button
                type="button"
                onClick={extinguishAllCandles}
                className="underline hover:text-ink transition-colors"
              >
                or blow with 1-click
              </button>
            </div>
          </div>
        )}

        {/* Case 2: Requesting microphone permission */}
        {micState === "requesting" && (
          <div className="rounded-2xl border border-rose-deep/20 bg-white/80 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ink">
              <span className="size-2 rounded-full bg-rose-deep animate-ping" />
              <span>Requesting microphone access…</span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Please click &quot;Allow&quot; in your browser prompt so the cake can hear your breath.
            </p>
          </div>
        )}

        {/* Case 3: Calibrating baseline room noise */}
        {micState === "calibrating" && (
          <div className="rounded-2xl border border-rose-deep/20 bg-white/85 p-4 shadow-sm backdrop-blur-md space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-rose-deep">
              <Sparkles size={16} />
              <span>Calibrating your wish… 🤫</span>
            </div>
            <p className="text-xs text-ink-soft">
              Measuring ambient room sound for 1 second so only your real blow counts…
            </p>
            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose/20">
              <div
                className="h-full bg-rose-deep transition-all duration-100 ease-out"
                style={{ width: `${Math.min(100, micLevel * 500)}%` }}
              />
            </div>
          </div>
        )}

        {/* Case 4: Active listening state */}
        {micState === "listening" && (
          <div className="rounded-2xl border border-rose-deep/20 bg-white/85 p-4 shadow-md backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-deep">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-deep opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-rose-deep" />
                </span>
                <span>Listening for your breath… 🌬️</span>
              </div>
              <span className="text-[11px] font-medium text-ink-soft">
                {litCount} of {candleCount} lit
              </span>
            </div>

            {/* Live Blow Intensity Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-ink-soft">
                <span>Breath intensity</span>
                <span>{Math.round(micLevel * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full transition-all duration-75 ease-out"
                  style={{
                    width: `${Math.min(100, micLevel * 100)}%`,
                    backgroundColor: micLevel > 0.6 ? "#E63956" : "#DE5D83",
                  }}
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-ink-soft">
              Blow gently or firmly into your microphone! The flames will sway and go out.
            </p>

            {/* Instant fallback buttons */}
            <div className="flex items-center justify-center gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={extinguishNextLitCandle}
                className="focus-ring rounded-full border border-ink/10 bg-cream/70 px-3 py-1 font-medium text-ink-soft hover:text-ink transition-colors"
              >
                🌬️ Blow 1 Candle
              </button>
              <button
                type="button"
                onClick={extinguishAllCandles}
                className="focus-ring rounded-full bg-rose-deep/10 px-3.5 py-1 font-semibold text-rose-deep hover:bg-rose-deep/20 transition-colors"
              >
                Blow All Candles 🎂
              </button>
            </div>
          </div>
        )}

        {/* Case 5: Error or mic permission denied fallback */}
        {micState === "error" && (
          <div className="rounded-2xl border border-rose-deep/25 bg-white/90 p-4 shadow-sm backdrop-blur-md space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-deep">
              <MicOff size={15} />
              <span>{errorMessage}</span>
            </div>
            <p className="text-xs text-ink-soft">
              You can tap each candle directly on the cake, or click the button below to blow them all out!
            </p>
            <button
              type="button"
              onClick={extinguishAllCandles}
              className="focus-ring w-full rounded-full bg-rose-deep py-3 text-sm font-bold text-cream shadow-sm hover:opacity-95 transition-all active:scale-95"
            >
              Blow Out Candles 🌬️
            </button>
          </div>
        )}

        {/* Case 6: Celebration screen when all candles are blown out! */}
        {allCandlesOut && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-3xl border border-rose-deep/25 bg-white/90 p-5 shadow-xl backdrop-blur-md space-y-4"
          >
            <div className="space-y-1">
              <p className="font-display text-xl font-bold text-ink sm:text-2xl">
                Yay! Your wish is granted! 🥳✨
              </p>
              <p className="text-xs text-ink-soft sm:text-sm">
                Now unfold the rest of your birthday surprise to reveal your handwritten letter, memories, and balloon wishes.
              </p>
            </div>

            {/* Main Action to reveal the letter / surprise */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={onProceed}
                className="focus-ring group w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose-deep py-3.5 px-6 text-sm sm:text-base font-bold text-cream shadow-lg shadow-rose/25 transition-all hover:opacity-95 hover:shadow-xl active:scale-95"
              >
                <span>Unfold Your Letter & Wishes</span>
                <span className="transition-transform group-hover:translate-x-1">✉️</span>
              </button>

              <div className="flex items-center justify-center gap-3 pt-1">
                {/* Replay / Relight button */}
                <button
                  type="button"
                  onClick={handleRelight}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream/70 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Relight Candles</span>
                </button>

                {/* Music toggle button */}
                <button
                  type="button"
                  onClick={toggleMusic}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream/70 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
                >
                  {musicMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>Birthday Tune {musicMuted ? "Muted" : "Playing"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Festive confetti explosion component rendered upon candle blowout
 */
function ConfettiExplosion() {
  const pieces = Array.from({ length: 42 });
  const colors = ["#FA8CA5", "#DE5D83", "#FFD166", "#06D6A0", "#118AB2", "#C77DFF", "#FFAAA6"];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = (i % 8) * 0.12;
        const duration = 2.4 + (i % 5) * 0.4;
        const size = 6 + (i % 4) * 3;
        const isCircle = i % 3 === 0;

        return (
          <motion.span
            key={i}
            className="absolute top-0"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * (isCircle ? 1 : 1.6)}px`,
              backgroundColor: color,
              borderRadius: isCircle ? "50%" : "2px",
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: ["0vh", "100vh"],
              x: [(i % 2 ? 25 : -25), (i % 2 ? -35 : 35)],
              rotate: [0, 360 * (i % 2 ? 2 : -2)],
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration,
              delay,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        );
      })}
    </div>
  );
}
