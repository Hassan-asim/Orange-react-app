export enum Language {
  EN = 'EN',
  RU = 'RU',
}

export interface LanguageDetails {
  code: Language;
  name: string;
}

export type Theme = 'light' | 'dark';

export interface User {
  uid: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  language: Language;
  theme: Theme;
}

export interface Message {
  id: string;
  senderUid: string;
  text: string;
  originalText?: string;
  timestamp: any; // Firestore timestamp
  isTranslated: boolean;
  error?: string;
  type: 'text' | 'voice';
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: User[];
  lastMessage: Message | null;
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  fromUser: User;
}


export enum Screen {
  SPLASH,
  LOGIN,
  MAIN,
  CHAT,
  SETTINGS,
  ADD_FRIEND,
}
