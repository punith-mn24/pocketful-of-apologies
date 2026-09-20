import { useEffect, useState } from "react";
import { defaultPersonalization, type Personalization } from "../config/surprise";

const STORAGE_KEY = "little-letter-personalization";

export function usePersistentPersonalization() {
  const [value, setValue] = useState<Personalization>(defaultPersonalization);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Personalization>;
        setValue({
          ...defaultPersonalization,
          ...parsed,
          photos: Array.isArray(parsed.photos) ? parsed.photos : [],
          balloonMessages: Array.isArray(parsed.balloonMessages) && parsed.balloonMessages.length
            ? parsed.balloonMessages
            : [...defaultPersonalization.balloonMessages],
        });
      }
    } catch {
      // The experience remains usable if storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Large photos can exceed browser storage; keep the live experience working.
    }
  }, [ready, value]);

  return { value, setValue, ready };
}