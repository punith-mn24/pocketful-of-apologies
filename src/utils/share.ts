import type { Personalization } from "../config/surprise";

export type EncodedPayload = {
  n?: string; // nickname
  c?: string; // custom nickname
  s?: string; // sender
  m?: string; // message note
  b?: string[]; // balloon messages
  o?: number; // auto-open to envelope (1 = yes)
};

export function encodePersonalizationToUrl(p: Personalization, autoOpen = false): string {
  if (typeof window === "undefined") return "";

  const payload: EncodedPayload = {
    n: p.nickname,
    c: p.customNickname || undefined,
    s: p.senderName || undefined,
    m: p.note || undefined,
    b: p.balloonMessages && p.balloonMessages.length ? p.balloonMessages : undefined,
    o: autoOpen ? 1 : 0,
  };

  try {
    const json = JSON.stringify(payload);
    // UTF-8 safe base64 encoding
    const b64 = window.btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
    // URL-safe replacement
    const urlSafe = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const base = window.location.origin + window.location.pathname;
    return `${base}?s=${urlSafe}`;
  } catch (err) {
    console.error("Failed to encode share link", err);
    // Fallback to simple query params
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (p.customNickname || p.nickname) params.set("to", p.customNickname || p.nickname);
    if (p.senderName) params.set("from", p.senderName);
    if (p.note) params.set("note", p.note);
    if (autoOpen) params.set("open", "1");
    return `${base}?${params.toString()}`;
  }
}

export function decodePersonalizationFromUrl(search: string): { data: Partial<Personalization>; autoOpen: boolean } | null {
  if (!search) return null;

  try {
    const params = new URLSearchParams(search);
    const s = params.get("s");

    if (s) {
      // Restore standard base64 from URL-safe
      let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";

      const json = decodeURIComponent(
        Array.from(window.atob(b64))
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const parsed = JSON.parse(json) as EncodedPayload;
      return {
        data: {
          nickname: parsed.n || "Bestie",
          customNickname: parsed.c || "",
          senderName: parsed.s || "",
          note: parsed.m || "",
          balloonMessages: Array.isArray(parsed.b) && parsed.b.length ? parsed.b : undefined,
        },
        autoOpen: Boolean(parsed.o),
      };
    }

    // Also support readable parameters: ?to=...&from=...&note=...
    const to = params.get("to");
    const from = params.get("from");
    const note = params.get("note");
    if (to || from || note) {
      return {
        data: {
          nickname: "Custom",
          customNickname: to || "",
          senderName: from || "",
          note: note || "",
        },
        autoOpen: params.get("open") === "1",
      };
    }
  } catch (err) {
    console.error("Failed to decode URL personalization", err);
  }

  return null;
}
