import { useEffect, useState } from "react";
import { defaultPersonalization, type Personalization } from "../config/surprise";

const STORAGE_KEY = "little-letter-personalization";

export function usePersistentPersonalization() {
  const [value, setValue] = useState<Personalization>(defaultPersonalization);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setValue({ ...defaultPersonalization, ...JSON.parse(stored) });
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