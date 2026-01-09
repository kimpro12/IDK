export type PackId = 'free' | 'love' | 'career' | 'finance';

export type Category =
  | 'ritual'
  | 'reflection'
  | 'action'
  | 'grounding'
  | 'connection'
  | 'focus'
  | 'growth'
  | 'clarity';

export type Tone = 'soft' | 'bold' | 'neutral' | 'uplifting' | 'steady';

export type MessageCard = {
  id: string;
  text: string;
  category: Category;
  tone: Tone;
  weight?: number;
};
