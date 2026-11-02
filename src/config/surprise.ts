export const surpriseConfig = {
  nicknames: ["Bestie", "Buddy", "Superstar", "Partner in Crime", "Sunshine", "Birthday Star", "Custom"],
  balloonMessages: [
    "You make every day more fun.",
    "Thanks for always having my back.",
    "Youâ€™re one in a million.",
    "Our memories are my favorite.",
    "So lucky to call you my friend.",
    "Hereâ€™s to more adventures together.",
    "A little something, just for your big day.",
  ],
  memoryMessages: [
    "Some moments are worth keeping.",
    "Some friends make ordinary days feel special.",
  ],
  finalLead: "Happy Birthday!",
  finalThanks: "So glad weâ€™re friends.",
  maxNoteLength: 600,
  maxPhotos: 2,
  maxPhotoBytes: 1_500_000,
} as const;

export type Personalization = {
  nickname: string;
  customNickname: string;
  senderName: string;
  note: string;
  photos: string[];
  balloonMessages: string[];
};

export const defaultPersonalization: Personalization = {
  nickname: "Bestie",
  customNickname: "",
  senderName: "Your Friend",
  note: "Happy Birthday! Wishing you all the sweetest moments today and always. Thank you for bringing so much warmth, laughter, and sunshine into my life. Here's to another beautiful year together! 🌷✨",
  photos: [],
  balloonMessages: [...surpriseConfig.balloonMessages],
};

