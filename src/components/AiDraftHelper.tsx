import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { draftBirthdayMessage, type DraftInput } from "../lib/ai-draft.functions";

const tones: DraftInput["tone"][] = ["Sweet & heartfelt", "Playful & teasing", "Hype & wholesome"];

export function AiDraftHelper({ defaultName, balloonCount, onDraft }: { defaultName: string; balloonCount: number; onDraft: (note: string, balloons: string[]) => void }) {
  const draft = useServerFn(draftBirthdayMessage);
  const [name, setName] = useState(defaultName);
  const [personality, setPersonality] = useState("");
  const [memories, setMemories] = useState("");
  const [tone, setTone] = useState<DraftInput["tone"]>("Sweet & heartfelt");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const run = async () => {
    if (!name.trim() || !memories.trim()) { setStatus({ kind: "error", text: "Add their name and at least one memory." }); return; }
    setLoading(true); setStatus(null);
    try {
      const res = await draft({ data: { name, personality, memories, tone, balloonCount } });
      if ("error" in res) setStatus({ kind: "error", text: res.error });
      else { onDraft(res.note, res.balloonMessages); setStatus({ kind: "ok", text: "Draft added below — tweak anything, then save." }); }
    } catch { setStatus({ kind: "error", text: "Couldn't write a draft right now. Please try again." }); }
    finally { setLoading(false); }
  };

  return <section className="rounded-2xl border border-rose-deep/20 bg-blush/30 p-4 sm:p-5">
    <h3 className="flex items-center gap-2 font-display text-xl"><Wand2 size={18} /> Write it with AI</h3>
    <p className="mt-1 text-sm text-ink-soft">Tell us about your friend and we'll draft the message and balloon notes.</p>
    <div className="mt-4 space-y-3">
      <div><label className="field-label" htmlFor="ai-name">Their name</label><input id="ai-name" className="field" maxLength={40} value={name} onChange={e => setName(e.target.value)} /></div>
      <div><label className="field-label" htmlFor="ai-personality">What are they like?</label><input id="ai-personality" className="field" maxLength={400} value={personality} onChange={e => setPersonality(e.target.value)} placeholder="Loud laugh, loves cats, always late" /></div>
      <div><label className="field-label" htmlFor="ai-memories">Shared memories & inside jokes</label><textarea id="ai-memories" rows={4} className="field resize-none" maxLength={1500} value={memories} onChange={e => setMemories(e.target.value)} placeholder="That road trip where we got lost, 2am momo runs…" /></div>
      <fieldset><legend className="field-label">Tone</legend><div className="flex flex-wrap gap-2">{tones.map(t => <button key={t} type="button" aria-pressed={tone === t} onClick={() => setTone(t)} className={`focus-ring min-h-10 rounded-full border px-3 text-sm ${tone === t ? "border-rose-deep bg-rose-deep text-cream" : "border-ink/10 bg-background text-ink-soft"}`}>{t}</button>)}</div></fieldset>
      <button type="button" onClick={run} disabled={loading} className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-deep px-5 text-sm font-semibold text-cream disabled:opacity-60">{loading ? <><Loader2 size={16} className="animate-spin" /> Writing something special…</> : <><Wand2 size={16} /> Draft my message</>}</button>
      {status && <p role={status.kind === "error" ? "alert" : "status"} className={`text-sm font-medium ${status.kind === "error" ? "text-wine" : "text-rose-deep"}`}>{status.text}</p>}
    </div>
  </section>;
}
