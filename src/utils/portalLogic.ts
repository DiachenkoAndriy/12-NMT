import { Chapter, Flashcard, HistoricalFigure, SearchResult, TimelineEvent } from '../types/portal';

export interface TextSegment {
  text: string;
  bold: boolean;
}

export function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

export function parseBoldSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

export interface StructuredListItem {
  heading: string;
  body: string;
}

export function parseStructuredListItem(raw: string): StructuredListItem | null {
  const trimmed = raw.trim();
  // Match "**Heading:** body" or "**Heading** — body" / "**Heading** – body"
  const colonInside = /^\*\*([^*]+?):\*\*\s+([\s\S]+)$/.exec(trimmed);
  if (colonInside) {
    const heading = colonInside[1].trim();
    const body = colonInside[2].trim();
    if (heading.length > 0 && heading.length <= 120 && body.length > 0) {
      return { heading, body };
    }
  }

  const sepOutside = /^\*\*([^*]+?)\*\*\s*(?:[:—–-])\s+([\s\S]+)$/.exec(trimmed);
  if (sepOutside) {
    const heading = sepOutside[1].replace(/:$/, '').trim();
    const body = sepOutside[2].trim();
    if (heading.length > 0 && heading.length <= 120 && body.length > 0) {
      return { heading, body };
    }
  }

  return null;
}

function buildSnippet(rawText: string, normalizedQuery: string): string {
  const clean = stripMarkdownBold(rawText);
  const lower = clean.toLowerCase();
  const idx = lower.indexOf(normalizedQuery);
  if (idx === -1) {
    return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
  }
  const start = Math.max(0, idx - 45);
  const end = Math.min(clean.length, idx + normalizedQuery.length + 75);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < clean.length ? '…' : '';
  return `${prefix}${clean.slice(start, end)}${suffix}`;
}

export function searchPortal(query: string, chapters: Chapter[], limit = 24): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }
  const q = trimmed.toLowerCase();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  const pushUnique = (item: SearchResult) => {
    const key = `${item.chapterId}:${item.kind}:${item.title}`;
    if (!seen.has(key) && results.length < limit) {
      seen.add(key);
      results.push(item);
    }
  };

  for (const chapter of chapters) {
    for (const d of chapter.dates) {
      if (d.date.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) {
        pushUnique({
          id: `sr-date-${chapter.id}-${d.date}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Дата',
          title: d.date,
          snippet: buildSnippet(d.description, q),
          matchText: d.date,
        });
      }
    }

    for (const f of chapter.figures) {
      if (f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) {
        pushUnique({
          id: `sr-fig-${chapter.id}-${f.name}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Персоналія',
          title: f.years ? `${f.name} (${f.years})` : f.name,
          snippet: buildSnippet(f.description, q),
          matchText: f.name,
        });
      }
    }

    for (const t of chapter.terms) {
      if (t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)) {
        pushUnique({
          id: `sr-term-${chapter.id}-${t.term}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Термін',
          title: t.term,
          snippet: buildSnippet(t.definition, q),
          matchText: t.term,
        });
      }
    }

    for (const quote of chapter.quotes) {
      if (
        quote.text.toLowerCase().includes(q) ||
        quote.attribution.toLowerCase().includes(q) ||
        quote.marker.toLowerCase().includes(q)
      ) {
        pushUnique({
          id: `sr-quote-${quote.id}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Цитата',
          title: quote.attribution,
          snippet: buildSnippet(quote.text, q),
          matchText: quote.attribution,
        });
      }
    }

    for (const trap of chapter.trapSummary.items) {
      if (trap.trap.toLowerCase().includes(q) || trap.explanation.toLowerCase().includes(q)) {
        pushUnique({
          id: `sr-trap-${chapter.id}-${trap.trap}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Пастка НМТ',
          title: trap.trap,
          snippet: buildSnippet(trap.explanation, q),
          matchText: trap.trap,
        });
      }
    }

    for (const sec of chapter.sections) {
      const secMatch = sec.title.toLowerCase().includes(q);
      if (secMatch) {
        pushUnique({
          id: `sr-sec-${sec.id}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Теорія',
          title: `${sec.number}. ${sec.title}`,
          snippet: chapter.summary,
          matchText: sec.title,
        });
        continue;
      }

      for (const block of sec.blocks) {
        let raw = '';
        if (block.type === 'paragraph' || block.type === 'subheading') {
          raw = block.text;
        } else if (block.type === 'list') {
          raw = block.items.find((item) => stripMarkdownBold(item).toLowerCase().includes(q)) ?? '';
        } else if (block.type === 'table') {
          const matchedRow = block.rows.find((row) =>
            row.some((cell) => stripMarkdownBold(cell).toLowerCase().includes(q)),
          );
          raw = matchedRow ? matchedRow.join(' — ') : '';
        } else if (block.type === 'trap') {
          raw = block.text;
        }

        if (raw && stripMarkdownBold(raw).toLowerCase().includes(q)) {
          pushUnique({
            id: `sr-block-${sec.id}-${results.length}`,
            chapterId: chapter.id,
            chapterTitle: chapter.shortTitle,
            kind: 'Теорія',
            title: `${sec.number}. ${sec.title}`,
            snippet: buildSnippet(raw, q),
            matchText: sec.title,
          });
          break;
        }
      }
    }

    for (const fc of chapter.flashcards) {
      if (fc.question.toLowerCase().includes(q) || fc.answer.toLowerCase().includes(q)) {
        pushUnique({
          id: `sr-fc-${fc.id}`,
          chapterId: chapter.id,
          chapterTitle: chapter.shortTitle,
          kind: 'Флеш-картка',
          title: fc.question,
          snippet: buildSnippet(fc.answer, q),
          matchText: fc.question,
        });
      }
    }
  }

  return results;
}

export function filterTimeline(
  events: TimelineEvent[],
  query: string,
  category: string,
): TimelineEvent[] {
  const q = query.trim().toLowerCase();
  return events.filter((ev) => {
    const matchesCategory = category === 'Усі' || ev.category === category;
    const matchesQuery =
      q === '' ||
      ev.date.toLowerCase().includes(q) ||
      ev.event.toLowerCase().includes(q) ||
      ev.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

export function filterFigures(
  figures: HistoricalFigure[],
  query: string,
  category: string,
): HistoricalFigure[] {
  const q = query.trim().toLowerCase();
  return figures.filter((fig) => {
    const matchesCategory = category === 'Усі' || fig.category === category;
    const matchesQuery =
      q === '' ||
      fig.name.toLowerCase().includes(q) ||
      fig.sphere.toLowerCase().includes(q) ||
      fig.achievements.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

export function shuffleFlashcards<T>(cards: T[]): T[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function calculateProgress(completedChapterIds: number[], totalChapters: number): {
  completedCount: number;
  totalCount: number;
  percentage: number;
} {
  const uniqueValid = new Set(
    completedChapterIds.filter((id) => id >= 1 && id <= totalChapters),
  );
  const completedCount = uniqueValid.size;
  const percentage = totalChapters === 0 ? 0 : Math.round((completedCount / totalChapters) * 100);
  return {
    completedCount,
    totalCount: totalChapters,
    percentage,
  };
}

export function getTrainerDeck(
  chapters: Chapter[],
  chapterFilter: number | 'all',
  onlyUnmemorized: boolean,
  memorizedCardIds: string[],
): Flashcard[] {
  const memorizedSet = new Set(memorizedCardIds);
  const baseCards =
    chapterFilter === 'all'
      ? chapters.flatMap((c) => c.flashcards)
      : chapters.find((c) => c.id === chapterFilter)?.flashcards ?? [];

  if (!onlyUnmemorized) {
    return baseCards;
  }
  return baseCards.filter((card) => !memorizedSet.has(card.id));
}
