import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { Settings } from "lucide-react";
import { useCallback, useState } from "react";
import { BalloonSection, Envelope, FinalSurprise, FloatingParticles, LandingScreen, Letter, MusicToggle, PhotoReveal, Progress, ScreenTransition, SettingsPanel, type Screen } from "../components/SurpriseUI";
import { usePersistentPersonalization } from "../hooks/usePersistentPersonalization";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Aesthetic Birthday Surprise 🌷 — A Little Something For You" },
    { name: "description", content: "Create an aesthetic pink floral birthday card & interactive surprise — handwritten letter, memories, and floating balloons to pop." },
    { property: "og:title", content: "Aesthetic Birthday Surprise 🌷" },
    { property: "og:description", content: "An aesthetic interactive birthday surprise made with pink tulips, bows, and love." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

function Index() {
  const { value, setValue, ready } = usePersistentPersonalization();
  const [screen, setScreen] = useState<Screen>("landing");
  const [sound, setSound] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  if (!ready) return <div className="min-h-screen bg-background" />;
  const changeScreen = (next: Screen) => { setScreen(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="mesh-bg relative min-h-screen overflow-x-hidden">
      <FloatingParticles />
      <header className="relative z-30 flex h-20 items-center justify-between px-5 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-rose-deep text-cream text-lg shadow-sm">🌷</span>
          <div>
            <p className="text-[10px] uppercase tracking-[.28em] text-ink-soft">Straight from the heart</p>
            <p className="font-display text-lg font-bold leading-none text-ink">Happy Birthday</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open surprise settings"
            title="Surprise settings"
            className="focus-ring grid size-11 place-items-center rounded-full border border-ink/10 bg-cream/80 text-ink-soft backdrop-blur-md hover:text-ink hover:border-ink/20 transition-colors"
          >
            <Settings size={17} />
          </button>
          <button
            type="button"
            onClick={() => setSound(!sound)}
            className="focus-ring hidden min-h-11 rounded-full border border-ink/10 bg-cream/80 px-4 text-xs font-medium text-ink-soft backdrop-blur-md sm:block hover:text-ink transition-colors"
          >
            Sounds {sound ? "on 🔔" : "off 🔕"}
          </button>
          <MusicToggle />
        </div>
      </header>
      <AnimatePresence mode="wait">
        {screen === "landing" && <ScreenTransition screen={screen}><LandingScreen data={value} setData={setValue} onOpenSettings={() => setSettingsOpen(true)} onCreate={() => changeScreen("envelope")} /></ScreenTransition>}
        {screen === "envelope" && <ScreenTransition screen={screen}><Envelope sound={sound} onOpen={() => changeScreen("letter")} /></ScreenTransition>}
        {screen === "letter" && <ScreenTransition screen={screen}><Letter data={value} onNext={() => changeScreen("photos")} /></ScreenTransition>}
        {screen === "photos" && <ScreenTransition screen={screen}><PhotoReveal photos={value.photos} onNext={() => changeScreen("balloons")} /></ScreenTransition>}
        {screen === "balloons" && <ScreenTransition screen={screen}><BalloonSection messages={value.balloonMessages} sound={sound} onComplete={() => changeScreen("final")} /></ScreenTransition>}
        {screen === "final" && <ScreenTransition screen={screen}><FinalSurprise data={value} sound={sound} onReplay={() => changeScreen("landing")} /></ScreenTransition>}
      </AnimatePresence>
      <SettingsPanel open={settingsOpen} data={value} setData={setValue} onClose={closeSettings} />
      <Progress screen={screen} />
    </div>
  );
}
