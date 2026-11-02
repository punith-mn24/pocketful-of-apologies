import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ImagePlus, Music, Music2, RotateCcw, Save, Settings, Sparkles, X, Heart } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import blushingCatSticker from "../assets/blushing-cat-sticker.png";
import catTulipsSticker from "../assets/cat-tulips-sticker.png";
import envelopeHeartSticker from "../assets/envelope-heart-sticker.png";
import ratHeartOutlineSticker from "../assets/rat-heart-outline-sticker.png";
import ratHeartSticker from "../assets/rat-heart-sticker.png";
import tulipRibbonSticker from "../assets/tulip-ribbon-sticker.png";
import pinterestRef from "../assets/pinterest-ref.jpg";
import { surpriseConfig, type Personalization } from "../config/surprise";
import { playTone, startAmbient } from "../utils/audio";
import { AiDraftHelper } from "./AiDraftHelper";

export type Screen = "landing" | "envelope" | "letter" | "photos" | "balloons" | "final";

const screenOrder: Screen[] = ["landing", "envelope", "letter", "photos", "balloons", "final"];

function CuteSticker({ src, alt, className = "", delay = 0 }: { src: string; alt: string; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.img src={src} alt={alt} width={512} height={512} loading="lazy" className={`cute-sticker pointer-events-none select-none object-contain ${className}`} initial={reduced ? false : { opacity: 0, y: 16, rotate: -3, scale: .9 }} animate={reduced ? { opacity: 1 } : { opacity: 1, y: [0, -7, 0], rotate: [-2, 2, -2], scale: 1 }} transition={reduced ? { duration: .1 } : { opacity: { duration: .45, delay }, scale: { duration: .5, delay }, y: { duration: 4.6, repeat: Infinity, ease: "easeInOut", delay }, rotate: { duration: 5.4, repeat: Infinity, ease: "easeInOut", delay } }} />;
}

export function AppButton({ children, onClick, type = "button", disabled, className = "" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream shadow-lg shadow-ink/10 transition-[transform,opacity] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}>{children}</button>;
}

export function SettingsPanel({ open, data, setData, onClose }: { open: boolean; data: Personalization; setData: (data: Personalization) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(data);
  const [error, setError] = useState("");
  const displayNickname = draft.nickname === "Custom" ? draft.customNickname : draft.nickname;
  useEffect(() => {
    if (!open) return;
    setDraft(data);
    setError("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, data, onClose]);
  const save = () => {
    const messages = draft.balloonMessages.map(message => message.trim());
    if (!displayNickname.trim() || !draft.note.trim() || messages.some(message => !message)) {
      setError("Add a nickname, a birthday message, and text for every balloon.");
      return;
    }
    setData({ ...draft, customNickname: draft.customNickname.trim(), note: draft.note.trim(), balloonMessages: messages });
    onClose();
  };
  const restoreDefaults = () => setDraft({ ...draft, nickname: "Bestie", customNickname: "", note: "", balloonMessages: [...surpriseConfig.balloonMessages] });
  return <AnimatePresence>{open && <>
    <motion.button type="button" aria-label="Close settings" className="fixed inset-0 z-50 cursor-default bg-ink/25 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside role="dialog" aria-modal="true" aria-labelledby="settings-title" className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col bg-cream shadow-2xl shadow-ink/20" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
      <div className="flex items-start justify-between border-b border-ink/10 px-5 py-5 sm:px-7"><div><p className="eyebrow">Make it theirs</p><h2 id="settings-title" className="mt-2 font-display text-3xl">Surprise settings</h2></div><button type="button" onClick={onClose} aria-label="Close settings" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-ink/10 text-ink-soft"><X size={19} /></button></div>
      <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
        <AiDraftHelper defaultName={displayNickname} balloonCount={draft.balloonMessages.length} onDraft={(note, balloons) => setDraft(d => ({ ...d, note, balloonMessages: d.balloonMessages.map((m, i) => balloons[i] ?? m) }))} />
        <fieldset><legend className="mb-3 font-display text-xl">What do you call them?</legend><div className="flex flex-wrap gap-2">{surpriseConfig.nicknames.map(nickname => <button type="button" key={nickname} aria-pressed={draft.nickname === nickname} onClick={() => setDraft({ ...draft, nickname })} className={`focus-ring min-h-11 rounded-full border px-4 text-sm transition-colors ${draft.nickname === nickname ? "border-rose-deep bg-rose-deep text-cream" : "border-ink/10 bg-background text-ink-soft"}`}>{nickname}</button>)}</div></fieldset>
        <AnimatePresence>{draft.nickname === "Custom" && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}><label className="field-label" htmlFor="settings-nickname">Nickname</label><input id="settings-nickname" className="field" value={draft.customNickname} maxLength={30} onChange={event => setDraft({ ...draft, customNickname: event.target.value })} placeholder="The name only you two use" autoFocus /></motion.div>}</AnimatePresence>
        <div><div className="mb-2 flex items-end justify-between"><label className="field-label mb-0" htmlFor="settings-note">Birthday message</label><span className="text-xs tabular-nums text-ink-soft">{draft.note.length} / {surpriseConfig.maxNoteLength}</span></div><textarea id="settings-note" rows={7} className="field resize-none font-handwriting text-xl" maxLength={surpriseConfig.maxNoteLength} value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} placeholder="Write the birthday wish you’ve been meaning to say…" /></div>
        <fieldset><legend className="font-display text-xl">Balloon messages</legend><p className="mt-1 text-sm leading-relaxed text-ink-soft">Each message appears after its balloon is popped.</p><div className="mt-4 space-y-3">{draft.balloonMessages.map((message, index) => <div key={index}><label className="field-label" htmlFor={`balloon-message-${index}`}>Balloon {index + 1}</label><input id={`balloon-message-${index}`} className="field" maxLength={100} value={message} onChange={event => setDraft({ ...draft, balloonMessages: draft.balloonMessages.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} /></div>)}</div></fieldset>
        {error && <p role="alert" className="rounded-lg bg-blush/60 px-4 py-3 text-sm font-medium text-wine">{error}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-cream px-5 py-4 sm:px-7"><button type="button" onClick={restoreDefaults} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink-soft"><RotateCcw size={15} /> Restore defaults</button><AppButton onClick={save}><Save size={16} /> Save settings</AppButton></div>
    </motion.aside>
  </>}</AnimatePresence>;
}

export function FloatingParticles({ celebration = false }: { celebration?: boolean }) {
  const reduced = useReducedMotion();
  return <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">{Array.from({ length: celebration ? 22 : 10 }).map((_, i) => <motion.span key={i} className={`absolute ${i % 3 ? "particle-dot" : "particle-heart"}`} style={{ left: `${(i * 37) % 96}%`, top: `${(i * 53) % 92}%` }} animate={reduced ? {} : { y: [0, -12 - (i % 4) * 6, 0], x: [0, i % 2 ? 8 : -8, 0], opacity: celebration ? [0, .75, 0] : [.15, .45, .15], rotate: [0, 15, 0] }} transition={{ duration: celebration ? 2.5 + (i % 3) : 7 + (i % 5), repeat: Infinity, delay: i * .12 }} />)}</div>;
}

export function MusicToggle() {
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<null | (() => void)>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const toggle = () => {
    if (playing) { stopRef.current?.(); stopRef.current = null; setPlaying(false); }
    else { stopRef.current = startAmbient(); setPlaying(true); }
  };
  return <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Turn music off" : "Turn music on"} className="focus-ring flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-cream/75 px-4 text-xs font-medium text-ink-soft backdrop-blur-md">{playing ? <Music2 size={15} /> : <Music size={15} />}<span className="hidden sm:inline">Music {playing ? "on" : "off"}</span></button>;
}

export function Progress({ screen }: { screen: Screen }) {
  const active = screenOrder.indexOf(screen);
  return <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-cream/65 px-4 py-2 backdrop-blur-md" aria-label={`Step ${active + 1} of ${screenOrder.length}`}>{screenOrder.map((item, i) => <span key={item} className={`h-1 rounded-full transition-all ${i === active ? "w-6 bg-rose-deep" : i < active ? "w-2 bg-rose" : "w-2 bg-ink/15"}`} />)}</div>;
}

export function ScreenTransition({ screen, children }: { screen: Screen; children: ReactNode }) {
  const reduced = useReducedMotion();
  return <motion.main key={screen} initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: .985 }} transition={{ duration: reduced ? .12 : .65, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 flex min-h-[calc(100svh-5rem)] items-center justify-center px-4 pb-20 pt-2 sm:px-8">{children}</motion.main>;
}

export function AestheticBirthdayCard({
  data,
  onOpenSurprise,
}: {
  data: Personalization;
  onOpenSurprise: () => void;
}) {
  const displayNickname = data.nickname === "Custom" ? data.customNickname : data.nickname;
  const displayName = displayNickname.trim() || "My Favorite Human";
  const sender = data.senderName.trim() || "Your Friend";
  const note = data.note.trim() || "Happy Birthday! Wishing you all the sweetest moments, brightest days, and pure happiness today and always. 🌷✨";

  return (
    <section className="flex w-full flex-col items-center">
      <div className="aesthetic-card-frame group relative aspect-[9/16] w-full max-w-[390px] select-none overflow-hidden rounded-[2rem] border-[5px] border-white/90 bg-[#FFFDF9] shadow-[0_25px_60px_-15px_rgba(222,93,131,0.32)]">
        {/* Pinterest background image with tulip bouquet and bows */}
        <img
          src={pinterestRef}
          alt="Aesthetic pink birthday card with tulips and bows"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />

        {/* Twinkling star sparkles over the card */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <span className="twinkle-star absolute right-[18%] top-[8%] text-xl font-bold">✦</span>
          <span className="twinkle-star absolute right-[36%] top-[14%] text-xs font-bold" style={{ animationDelay: "1s" }}>✧</span>
          <span className="twinkle-star absolute right-[12%] top-[24%] text-sm font-bold" style={{ animationDelay: "1.8s" }}>⋆</span>
          <span className="twinkle-star absolute right-[28%] top-[32%] text-base font-bold" style={{ animationDelay: "0.5s" }}>✦</span>
          <span className="twinkle-star absolute left-[10%] top-[42%] text-xs font-bold" style={{ animationDelay: "2.2s" }}>✧</span>
          <span className="twinkle-star absolute left-[22%] bottom-[24%] text-sm font-bold" style={{ animationDelay: "1.4s" }}>⋆</span>
          <span className="twinkle-star absolute right-[14%] bottom-[16%] text-xs font-bold" style={{ animationDelay: "0.8s" }}>✦</span>
        </div>

        {/* Card Content Overlay */}
        <div className="relative z-20 flex h-full flex-col justify-between p-5 sm:p-6">
          {/* Top spacer (allowing 'Happy Birthday!' in the image to shine) */}
          <div className="pt-2">
            <div className="h-14 sm:h-16" />
          </div>

          {/* Center Personalized Note Card */}
          <div className="my-auto space-y-3 px-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-deep/15 bg-white/70 p-4 shadow-sm backdrop-blur-[3px]"
            >
              <p className="font-display text-lg font-bold text-[#2D2226] sm:text-xl">
                Dear <span className="text-rose-deep">{displayName}</span>,
              </p>
              <p className="font-handwriting mt-2 max-h-[155px] overflow-y-auto text-xl leading-relaxed text-[#3B2C30] sm:text-2xl">
                {note}
              </p>
              <p className="font-display mt-3 text-right text-sm font-semibold italic text-rose-deep">
                — {sender}
              </p>
            </motion.div>

            {/* Polaroid photo if uploaded */}
            {data.photos[0] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 2 }}
                className="relative mx-auto mt-2 w-32 rounded-lg bg-white p-2 pb-3 shadow-md transition-transform hover:rotate-0"
              >
                <div className="washi-tape -top-2 left-1/2 -translate-x-1/2" />
                <img
                  src={data.photos[0]}
                  alt="Birthday memory"
                  className="aspect-square w-full rounded object-cover"
                />
                <p className="font-handwriting mt-1 text-center text-[11px] text-ink-soft">
                  special moment ♥
                </p>
              </motion.div>
            )}
          </div>

          {/* Bottom Interactive Tap-to-Open Callout */}
          <div className="pb-1 text-center">
            <button
              type="button"
              onClick={onOpenSurprise}
              className="focus-ring group/btn inline-flex items-center gap-2 rounded-full border border-rose-deep/20 bg-white/95 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-deep shadow-md backdrop-blur-md transition-all hover:bg-rose-deep hover:text-white active:scale-95"
            >
              <span>Tap to Open Surprise</span>
              <span className="transition-transform group-hover/btn:translate-x-1">💌</span>
            </button>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-[#6E585E]">
              Interactive Envelope • Wishes • Balloons
            </p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-ink-soft">
        🌸 Live interactive card preview — updates as you type
      </p>
    </section>
  );
}

export function LandingScreen({ data, setData, onCreate, onOpenSettings }: { data: Personalization; setData: (data: Personalization) => void; onCreate: () => void; onOpenSettings: () => void }) {
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const displayNickname = data.nickname === "Custom" ? data.customNickname : data.nickname;

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, surpriseConfig.maxPhotos - data.photos.length);
    if (files.some(file => !file.type.startsWith("image/") || file.size > surpriseConfig.maxPhotoBytes)) { setError("Choose JPG, PNG, or WebP images under 1.5 MB each."); return; }
    setError("");
    Promise.all(files.map(file => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }))).then(photos => setData({ ...data, photos: [...data.photos, ...photos].slice(0, 2) })).catch(() => setError("One of those photos could not be read."));
    event.target.value = "";
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayNickname.trim() || !data.note.trim() || data.balloonMessages.some(message => !message.trim())) { setError("Please complete the recipient name and birthday note."); return; }
    if (!data.senderName.trim()) { setError("Add your name so they know who sent it."); return; }
    setError(""); onCreate();
  };

  return (
    <div className="grid w-full max-w-6xl items-start gap-10 py-4 lg:grid-cols-2 lg:gap-14">
      {/* Customization Form */}
      <form onSubmit={submit} className="relative space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-deep/20 bg-rose/10 px-3.5 py-1 text-xs font-semibold text-rose-deep backdrop-blur-sm">
            <span>🎀</span>
            <span>Aesthetic Birthday Card & Surprise</span>
            <span>🌷</span>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl text-ink">
            Happy Birthday! <br />
            <em className="text-rose-deep italic">A little something for you.</em>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
            Inspired by pink tulips, handmade textured parchment, and delicate bows.
            Personalize your card below, then tap to reveal the full interactive surprise!
          </p>
        </div>

        {/* Recipient Nickname Quick Chips */}
        <div>
          <label className="field-label mb-2">Who is this birthday card for?</label>
          <div className="flex flex-wrap gap-2">
            {surpriseConfig.nicknames.map(nickname => (
              <button
                type="button"
                key={nickname}
                onClick={() => setData({ ...data, nickname })}
                className={`focus-ring min-h-10 rounded-full border px-4 text-xs font-semibold transition-all ${
                  data.nickname === nickname
                    ? "border-rose-deep bg-rose-deep text-cream shadow-sm scale-105"
                    : "border-ink/10 bg-cream/70 text-ink-soft hover:border-rose-deep/40"
                }`}
              >
                {nickname}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Nickname Input if Custom is selected */}
        <AnimatePresence>
          {data.nickname === "Custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="field-label" htmlFor="custom-nick">Their Name / Nickname</label>
              <input
                id="custom-nick"
                className="field"
                value={data.customNickname}
                maxLength={30}
                onChange={e => setData({ ...data, customNickname: e.target.value })}
                placeholder="e.g. My Sunshine, Jaan, Angel"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sender Name */}
        <div>
          <label className="field-label" htmlFor="sender">Your name</label>
          <input
            id="sender"
            className="field"
            value={data.senderName}
            maxLength={40}
            onChange={e => setData({ ...data, senderName: e.target.value })}
            placeholder="So they know who this is from"
          />
        </div>

        {/* Birthday Note */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label className="field-label mb-0" htmlFor="note">
              Birthday note <span className="font-normal text-ink-soft">(handwritten on card)</span>
            </label>
            <span className="text-xs tabular-nums text-ink-soft">
              {data.note.length} / {surpriseConfig.maxNoteLength}
            </span>
          </div>
          <textarea
            id="note"
            rows={4}
            className="field resize-none font-handwriting text-xl sm:text-2xl"
            maxLength={surpriseConfig.maxNoteLength}
            value={data.note}
            onChange={e => setData({ ...data, note: e.target.value })}
            placeholder="Write your sweet birthday wish..."
          />
        </div>

        {/* Photos */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="field-label mb-0">
              Attach Memory Photos <span className="font-normal text-ink-soft">(optional polaroids)</span>
            </span>
            <span className="text-xs text-ink-soft">{data.photos.length}/2</span>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onFiles} />
          <div className="grid grid-cols-2 gap-3">
            {data.photos.map((photo, i) => (
              <div key={photo.slice(-24)} className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm border border-rose-deep/10">
                <img src={photo} alt={`Memory ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setData({ ...data, photos: data.photos.filter((_, idx) => idx !== i) })}
                  className="focus-ring absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-cream/90 text-ink shadow-sm"
                  aria-label="Remove photo"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            {data.photos.length < 2 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="focus-ring flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-rose-deep/35 bg-blush/30 text-xs font-medium text-ink-soft hover:bg-blush/50"
              >
                <ImagePlus size={18} className="text-rose-deep" />
                <span>Upload photo</span>
              </button>
            )}
          </div>
        </div>

        {error && <p role="alert" className="text-sm font-medium text-wine">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <AppButton type="submit" className="flex-1 sm:flex-initial">
            Open Surprise 💌 <Sparkles size={16} />
          </AppButton>
          <button
            type="button"
            onClick={onOpenSettings}
            className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/10 bg-cream/80 px-5 text-xs font-semibold text-ink-soft hover:text-ink hover:border-ink/20"
          >
            <Settings size={15} /> Customize Balloon Wishes
          </button>
        </div>
      </form>

      {/* Aesthetic Card Component matching the Pinterest pin */}
      <div className="lg:sticky lg:top-24">
        <AestheticBirthdayCard data={data} onOpenSurprise={onCreate} />
      </div>
    </div>
  );
}

export function Envelope({ onOpen, sound }: { onOpen: () => void; sound: boolean }) {
  const [opened, setOpened] = useState(false);
  const reduced = useReducedMotion();
  const open = () => { if (opened) return; setOpened(true); if (sound) playTone("open"); window.setTimeout(onOpen, reduced ? 250 : 1450); };
  return <div className="relative text-center"><CuteSticker src={ratHeartSticker} alt="A tiny friend making a heart" className="absolute -left-8 top-16 hidden size-32 sm:block md:-left-40 md:size-40" /><CuteSticker src={envelopeHeartSticker} alt="A tiny love letter" className="absolute -right-5 top-2 size-20 sm:-right-28 sm:size-28" delay={.25} /><p className="eyebrow">A birthday note found its way to you</p><h1 className="mt-4 font-display text-4xl sm:text-6xl">Happy Birthday!</h1><button type="button" onClick={open} className="focus-ring mt-12 block" aria-label="Open the envelope"><motion.div className="envelope" animate={opened ? { y: 24, scale: 1.04 } : { y: [0, -10, 0] }} transition={opened ? { duration: .7 } : { duration: 4, repeat: Infinity }}><motion.div className="letter-inside" animate={opened ? { y: -105 } : { y: 8 }} transition={{ duration: .9, delay: .35 }}><span className="font-display text-xl">For you</span></motion.div><motion.div className="envelope-flap" animate={{ rotateX: opened ? 180 : 0 }} transition={{ duration: .75 }} /><div className="envelope-front"/><motion.div className="wax-seal" animate={opened ? { scale: 0, opacity: 0 } : { scale: 1 }}>♥</motion.div></motion.div></button><p className="mt-10 text-sm text-ink-soft">{opened ? "Opening…" : "Tap to open"}</p></div>;
}

export function Letter({ data, onNext }: { data: Personalization; onNext: () => void }) {
  const nickname = data.nickname === "Custom" ? data.customNickname : data.nickname;
  return <div className="letter-paper relative w-full max-w-2xl"><CuteSticker src={blushingCatSticker} alt="A blushing cat with hearts" className="absolute -right-3 -top-14 size-24 sm:-right-12 sm:-top-20 sm:size-36" /><p className="eyebrow">A note just for you</p><h1 className="mt-5 font-display text-4xl sm:text-5xl">Dear {nickname},</h1><motion.p className="mt-8 whitespace-pre-wrap font-handwriting text-2xl leading-loose text-ink/90 sm:text-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.4 }}>{data.note}</motion.p><motion.p className="mt-8 text-right font-display text-xl italic text-rose-deep" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>— {data.senderName}</motion.p>{data.photos[0] && <motion.img initial={{ opacity: 0, rotate: -2, scale: .94 }} animate={{ opacity: 1, rotate: 1, scale: 1 }} transition={{ delay: 1.2 }} src={data.photos[0]} alt="Your first shared memory" className="mt-9 aspect-[16/9] w-full rounded-xl object-cover shadow-xl shadow-ink/10"/>}<AppButton onClick={onNext} className="mt-10">There’s more <ArrowRight size={16}/></AppButton></div>;
}

export function PhotoReveal({ photos, onNext }: { photos: string[]; onNext: () => void }) {
  return <div className="relative w-full max-w-5xl"><CuteSticker src={catTulipsSticker} alt="A cat bringing pink tulips" className="absolute -left-4 top-12 z-20 size-28 sm:-left-8 sm:top-20 sm:size-40 lg:-left-20" /><div className="text-center"><p className="eyebrow">A memory worth keeping</p><h1 className="mt-4 font-display text-4xl sm:text-6xl">Best. Moments. Ever.</h1></div>{photos.length ? <div className="relative mx-auto mt-10 max-w-3xl pb-16"><motion.img initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} src={photos[0]} alt="A cherished memory" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl shadow-ink/15"/>{photos[1] && <motion.div initial={{ opacity: 0, x: 35, rotate: 7 }} animate={{ opacity: 1, x: 0, rotate: 4 }} transition={{ delay: .55 }} className="absolute -bottom-3 right-3 w-[42%] rounded-xl bg-cream p-2 shadow-2xl sm:-right-10"><img src={photos[1]} alt="Another cherished memory" className="aspect-square w-full rounded-lg object-cover"/></motion.div>}<div className="film-grain"/></div> : <div className="mx-auto mt-12 grid aspect-square max-w-xs place-items-center rounded-full bg-blush/55"><motion.span className="font-display text-8xl text-rose-deep" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>♥</motion.span></div>}<div className="mx-auto mt-8 max-w-lg text-center font-display text-xl italic leading-relaxed text-ink-soft">{surpriseConfig.memoryMessages.map(message => <p key={message}>{message}</p>)}</div><div className="mt-9 text-center"><AppButton onClick={onNext}>Keep going <ArrowRight size={16}/></AppButton></div></div>;
}

export function BalloonSection({ messages, onComplete, sound }: { messages: string[]; onComplete: () => void; sound: boolean }) {
  const [popped, setPopped] = useState<number[]>([]);
  const pop = (index: number) => { if (popped.includes(index)) return; const next = [...popped, index]; setPopped(next); if (sound) playTone("pop"); if (next.length === messages.length) window.setTimeout(onComplete, 1200); };
  return <div className="relative w-full max-w-5xl text-center"><CuteSticker src={ratHeartOutlineSticker} alt="A tiny friend sending a heart" className="absolute -right-3 -top-12 size-24 sm:right-4 sm:size-32 lg:-right-10" /><p className="eyebrow">A few small wishes</p><h1 className="mt-4 font-display text-4xl sm:text-6xl">Pop every balloon</h1><p className="mt-3 text-ink-soft">Each one holds a birthday wish.</p><div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">{messages.map((message, i) => { const isPopped = popped.includes(i); return <button key={`${i}-${message}`} type="button" onClick={() => pop(i)} disabled={isPopped} className="focus-ring relative flex min-h-44 items-center justify-center" aria-label={isPopped ? message : `Pop balloon ${i + 1}`}><AnimatePresence mode="wait">{isPopped ? <motion.p key="message" initial={{ opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} className="font-display text-lg italic leading-snug text-wine">{message}</motion.p> : <motion.span key="balloon" className={`balloon balloon-${i % 4}`} animate={{ y: [0, -9, 0], rotate: [0, i % 2 ? 2 : -2, 0] }} exit={{ scale: 1.35, opacity: 0 }} transition={{ y: { duration: 3 + i * .12, repeat: Infinity, delay: i * .1 }, rotate: { duration: 3 + i * .12, repeat: Infinity, delay: i * .1 }, scale: { duration: .25 }, opacity: { duration: .25 } }}><span className="balloon-shine"/><span className="balloon-string"/></motion.span>}</AnimatePresence></button>; })}</div><p className="mt-7 text-sm tabular-nums text-ink-soft">{popped.length} of {messages.length} opened</p></div>;
}

export function FinalSurprise({ data, onReplay, sound }: { data: Personalization; onReplay: () => void; sound: boolean }) {
  useEffect(() => { if (sound) playTone("final"); }, [sound]);
  return <div className="relative max-w-2xl text-center"><FloatingParticles celebration/><CuteSticker src={catTulipsSticker} alt="A cat offering pink tulips" className="absolute -left-10 top-16 size-32 sm:-left-32 sm:size-44" /><CuteSticker src={envelopeHeartSticker} alt="A tiny sealed love letter" className="absolute -right-4 top-2 size-20 sm:-right-24 sm:size-28" delay={.3} /><p className="eyebrow">One last thing…</p><motion.div className="mx-auto mt-8 grid size-36 place-items-center rounded-full bg-blush/70 text-6xl shadow-2xl shadow-rose/30" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }}>🎂</motion.div><h1 className="mt-8 font-display text-5xl sm:text-7xl">{surpriseConfig.finalLead}</h1><p className="mx-auto mt-7 max-w-xl whitespace-pre-wrap text-lg leading-relaxed text-ink-soft">{data.note}</p><p className="mt-7 font-display text-2xl italic text-wine">{surpriseConfig.finalThanks} <span aria-hidden="true">♥</span></p><AppButton onClick={onReplay} className="mt-10"><RotateCcw size={16}/> Replay the Surprise</AppButton></div>;
}
