export interface VisualInsertItem {
  src: string;
  alt: string;
  title?: string;
  caption: string;
  badge?: string;
}

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'trap'; label: string; text: string }
  | { type: 'flow'; label?: string; steps: string[] }
  | {
      type: 'figure';
      src: string;
      alt: string;
      title?: string;
      caption: string;
      badge?: string;
      aspect?: 'wide' | 'portrait' | 'square';
    }
  | {
      type: 'gallery';
      title?: string;
      columns?: 2 | 3;
      items: VisualInsertItem[];
    };

export interface TheorySection {
  id: string;
  number: string;
  title: string;
  blocks: ContentBlock[];
}

export interface HistoricalQuote {
  id: string;
  attribution: string;
  text: string;
  marker: string;
}

export interface DateItem {
  date: string;
  description: string;
}

export interface TermItem {
  term: string;
  definition: string;
}

export interface FigureItem {
  name: string;
  years?: string;
  description: string;
}

export interface Flashcard {
  id: string;
  chapterId: number;
  question: string;
  answer: string;
}

export interface NmtTrapSummary {
  title: string;
  items: {
    trap: string;
    explanation: string;
  }[];
}

export interface Chapter {
  id: number;
  shortTitle: string;
  title: string;
  period: string;
  summary: string;
  sections: TheorySection[];
  trapSummary: NmtTrapSummary;
  quotes: HistoricalQuote[];
  dates: DateItem[];
  terms: TermItem[];
  figures: FigureItem[];
  flashcards: Flashcard[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  sortYear: number;
  event: string;
  category: 'Геополітика та війни' | 'Економіка та побут' | 'Національний та суспільний рух' | 'Освіта, наука та культура';
  chapterId: number;
}

export interface HistoricalFigure {
  id: string;
  name: string;
  years?: string;
  sphere: string;
  category: 'Політика та рух' | 'Освіта та наука' | 'Література та преса' | 'Мистецтво та архітектура' | 'Військова справа та підприємництво';
  achievements: string;
  chapterIds: number[];
}

export interface NmtQuestion {
  id: string;
  chapterId: number;
  kind: 'Факт і хронологія' | 'Першоджерело' | 'Персоналія' | 'Термін і поняття' | 'Пастка НМТ';
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export type ActiveView =
  | { type: 'chapter'; chapterId: number; highlightText?: string }
  | { type: 'timeline' }
  | { type: 'figures' }
  | { type: 'trainer' }
  | { type: 'quiz'; initialChapterId?: number };

export interface SearchResult {
  id: string;
  chapterId: number;
  chapterTitle: string;
  kind: 'Дата' | 'Термін' | 'Персоналія' | 'Цитата' | 'Теорія' | 'Пастка НМТ' | 'Флеш-картка';
  title: string;
  snippet: string;
  matchText: string;
  sectionId?: string;
}
