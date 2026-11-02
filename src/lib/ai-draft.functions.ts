import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  personality: z.string().trim().max(400),
  memories: z.string().trim().min(1).max(1500),
  tone: z.enum(["Sweet & heartfelt", "Playful & teasing", "Hype & wholesome"]),
  balloonCount: z.number().int().min(1).max(10),
});

export type DraftInput = z.infer<typeof inputSchema>;
export type DraftResult = { note: string; balloonMessages: string[] } | { error: string };

export const draftBirthdayMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<DraftResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { error: "AI writing isn't set up yet." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const schema = z.object({ note: z.string(), balloonMessages: z.array(z.string()) });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system:
          "You write birthday surprise messages from one friend to another. Warm, specific, natural, never cringe or generic. Weave in the shared memories concretely. The birthday note must be under 550 characters, no greeting line (the page already says 'Dear name,') and no sign-off. Balloon notes are short (max 80 characters each), each unique and referencing different details. Minimal emojis.",
        prompt: `Birthday friend: ${data.name}\nPersonality: ${data.personality || "(not given)"}\nShared memories / inside jokes: ${data.memories}\nTone: ${data.tone}\nWrite exactly ${data.balloonCount} balloon notes.`,
        output: Output.object({ schema }),
        maxRetries: 0,
        providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
      });
      const out = await result.output;
      const messages = out.balloonMessages.map(m => m.trim().slice(0, 100)).filter(Boolean).slice(0, data.balloonCount);
      if (!out.note.trim() || messages.length === 0) return { error: "The AI couldn't write a draft this time. Try adding more details." };
      return { note: out.note.trim().slice(0, 600), balloonMessages: messages };
    } catch (err) {
      console.error("draftBirthdayMessage failed", err);
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 429) return { error: "Too many requests right now. Please wait a moment and try again." };
      if (status === 402) return { error: "AI credits have run out. Add credits in Settings → Plans & credits." };
      return { error: "Couldn't write a draft right now. Please try again." };
    }
  });

