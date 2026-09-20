export const surpriseConfig = {
  nicknames: ["Babe", "Jaan", "Love", "My Girl", "Baby", "Sunshine", "Custom"],
  balloonMessages: [
    "Thank you for being you.",
    "You make my days better.",
    "You’re genuinely special to me.",
    "Some memories never get old.",
    "I’m lucky to have you.",
    "Here’s to more moments together.",
    "A little something, just because.",
  ],
  memoryMessages: [
    "Some moments are worth keeping.",
    "Some people make ordinary days feel special.",
  ],
  finalLead: "I’m really sorry.",
  finalThanks: "Thank you for hearing me out.",
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
};

export const defaultPersonalization: Personalization = {
  nickname: "Jaan",
  customNickname: "",
  senderName: "",
  note: "",
  photos: [],
};