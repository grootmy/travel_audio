export interface AudioGuide {
  id: number;
  title: string;
  creator: string;
  city: string;
  duration: number;
  rating: number;
  cover: string;
}

export interface Message {
  from: 'bot' | 'user';
  text: string;
}

export type PageType = 'home' | 'chat' | 'explore'; 