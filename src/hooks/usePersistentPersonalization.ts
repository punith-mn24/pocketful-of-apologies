import { useEffect, useState } from "react";
import { defaultPersonalization, type Personalization } from "../config/surprise";
import { decodePersonalizationFromUrl } from "../utils/share";

const STORAGE_KEY = "birthday-surprise-personalization";

export function usePersistentPersonalization() {
  const [value, setValue] = useState<Personalization>(defaultPersonalization);
  const [ready, setReady] = useState(false);
  const [isFromSharedLink, setIsFromSharedLink] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    try {
      // 1. Check if URL contains personalized words shared by another person
      const urlDecoded = typeof window !== "undefined" ? decodePersonalizationFromUrl(window.location.search) : null;

      if (urlDecoded && urlDecoded.data) {
        setIsFromSharedLink(true);
        setAutoOpen(urlDecoded.autoOpen);
        setValue({
          ...defaultPersonalization,
          ...urlDecoded.data,
          photos: [], // shared links don't bloat URL with huge base64 photos
          balloonMessages:
            Array.isArray(urlDecoded.data.balloonMessages) && urlDecoded.data.balloonMessages.length
              ? urlDecoded.data.balloonMessages
              : [...defaultPersonalization.balloonMessages],
        });
      } else {
        // 2. Otherwise load saved draft from local storage
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Personalization>;
          setValue({
            ...defaultPersonalization,
            ...parsed,
            photos: Array.isArray(parsed.photos) ? parsed.photos : [],
            balloonMessages:
              Array.isArray(parsed.balloonMessages) && parsed.balloonMessages.length
                ? parsed.balloonMessages
                : [...defaultPersonalization.balloonMessages],
          });
        }
      }
    } catch {
      // Keep usable if storage or parsing fails
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || isFromSharedLink) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore storage quota limits
    }
  }, [ready, value, isFromSharedLink]);

  return { value, setValue, ready, isFromSharedLink, autoOpen };
}
