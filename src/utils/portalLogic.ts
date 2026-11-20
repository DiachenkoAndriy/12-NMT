import { Chapter, Flashcard, HistoricalFigure, NmtQuestion, SearchResult, TimelineEvent } from '../types/portal';

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
  const clean = stripMarkdownBold(rawText).replace(/\s+/g, ' ').trim();
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
          sectionId: sec.id,
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
            sectionId: sec.id,
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

export type TimelineDecade = 'Усі' | '1790-ті' | '1800–1810-ті' | '1820-ті' | '1830-ті' | '1840–1850-ті';

export function matchesTimelineDecade(sortYear: number, decade: TimelineDecade): boolean {
  switch (decade) {
    case 'Усі':
      return true;
    case '1790-ті':
      return sortYear < 1800;
    case '1800–1810-ті':
      return sortYear >= 1800 && sortYear < 1820;
    case '1820-ті':
      return sortYear >= 1820 && sortYear < 1830;
    case '1830-ті':
      return sortYear >= 1830 && sortYear < 1840;
    case '1840–1850-ті':
      return sortYear >= 1840;
    default:
      return true;
  }
}

export function filterTimeline(
  events: TimelineEvent[],
  query: string,
  category: string,
  decade: TimelineDecade = 'Усі',
): TimelineEvent[] {
  const q = query.trim().toLowerCase();
  return events.filter((ev) => {
    const matchesCategory = category === 'Усі' || ev.category === category;
    const matchesDecade = matchesTimelineDecade(ev.sortYear, decade);
    const matchesQuery =
      q === '' ||
      ev.date.toLowerCase().includes(q) ||
      ev.event.toLowerCase().includes(q) ||
      ev.category.toLowerCase().includes(q);
    return matchesCategory && matchesDecade && matchesQuery;
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

export function getFigureInitials(name: string): string {
  const cleaned = name.replace(/«|»|"|'/g, '').trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0 && w.toLowerCase() !== 'та' && w.toLowerCase() !== 'і');
  if (words.length === 0) return 'ІС';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
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

export function buildQuizQuestions(
  allQuestions: NmtQuestion[],
  chapterFilter: number | 'all',
  limit?: number,
  shouldShuffle = false,
): NmtQuestion[] {
  const filtered =
    chapterFilter === 'all'
      ? [...allQuestions]
      : allQuestions.filter((q) => q.chapterId === chapterFilter);
  const ordered = shouldShuffle ? shuffleFlashcards(filtered) : filtered;
  if (typeof limit === 'number' && limit > 0) {
    return ordered.slice(0, limit);
  }
  return ordered;
}

export function calculateQuizStats(
  questions: NmtQuestion[],
  selectedAnswers: Record<string, number>,
): {
  answeredCount: number;
  correctCount: number;
  totalCount: number;
  percentage: number;
  nmtScaledScore: number;
  weakChapterIds: number[];
} {
  let answeredCount = 0;
  let correctCount = 0;
  const wrongByChapter = new Map<number, number>();

  for (const q of questions) {
    const selected = selectedAnswers[q.id];
    if (typeof selected === 'number') {
      answeredCount += 1;
      if (selected === q.correctIndex) {
        correctCount += 1;
      } else {
        wrongByChapter.set(q.chapterId, (wrongByChapter.get(q.chapterId) ?? 0) + 1);
      }
    }
  }

  const totalCount = questions.length;
  const percentage = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
  // NMT 100–200 scale approximation for motivational feedback (100 minimum pass threshold at ~15%+, 200 max)
  const nmtScaledScore =
    totalCount === 0
      ? 100
      : Math.round(100 + (correctCount / totalCount) * 100);

  const weakChapterIds = Array.from(wrongByChapter.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([chapterId]) => chapterId);

  return {
    answeredCount,
    correctCount,
    totalCount,
    percentage,
    nmtScaledScore,
    weakChapterIds,
  };
}

export function estimateReadingMinutes(chapter: Chapter): number {
  let words = chapter.summary.split(/\s+/).length;
  for (const sec of chapter.sections) {
    words += sec.title.split(/\s+/).length;
    for (const block of sec.blocks) {
      if (block.type === 'paragraph' || block.type === 'subheading') {
        words += block.text.split(/\s+/).length;
      } else if (block.type === 'list') {
        for (const item of block.items) words += item.split(/\s+/).length;
      } else if (block.type === 'table') {
        for (const row of block.rows) {
          for (const cell of row) words += cell.split(/\s+/).length;
        }
      } else if (block.type === 'trap') {
        words += block.text.split(/\s+/).length;
      }
    }
  }
  for (const q of chapter.quotes) {
    words += q.text.split(/\s+/).length + q.marker.split(/\s+/).length;
  }
  return Math.max(3, Math.round(words / 165));
}

export interface StructuredCellLine {
  prefix?: string;
  body: string;
}

export interface StructuredCellContent {
  lead?: string;
  items: StructuredCellLine[];
}

export function parseStructuredCellLines(cell: string): StructuredCellContent | null {
  if (!cell.includes('\n')) return null;
  const lines = cell
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) return null;

  let lead: string | undefined;
  let itemLines = lines;

  if (lines[0].endsWith(':')) {
    lead = lines[0];
    itemLines = lines.slice(1);
  }

  const items: StructuredCellLine[] = itemLines.map((line) => {
    const match = /^(.+?)\s+—\s+([\s\S]+)$/.exec(line);
    if (match) {
      return { prefix: match[1].trim(), body: match[2].trim() };
    }
    return { body: line };
  });

  return { lead, items };
}

const NON_BREAKING_ABBRS = new Set([
  'р',
  'рр',
  'ст',
  'с',
  'м',
  'св',
  'тис',
  'млн',
  'млрд',
  'напр',
  'див',
  'ім',
  'проф',
  'акад',
  'губ',
  'пов',
  'шт',
  'вул',
  'пл',
  'ін',
  'кн',
  'вид',
  'ред',
  'мал',
  'рис',
]);

export function splitOutsideParensAndQuotes(text: string): string[] {
  const parts: string[] = [];
  let parenDepth = 0;
  let guillemetDepth = 0;
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') parenDepth += 1;
    else if (ch === ')' && parenDepth > 0) parenDepth -= 1;
    else if (ch === '«') guillemetDepth += 1;
    else if (ch === '»' && guillemetDepth > 0) guillemetDepth -= 1;
    else if (
      ch === ';' &&
      parenDepth === 0 &&
      guillemetDepth === 0 &&
      i + 1 < text.length &&
      /\s/.test(text[i + 1])
    ) {
      const piece = text.slice(start, i + 1).trim();
      if (piece) parts.push(piece);
      start = i + 1;
    }
  }

  const tail = text.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

export function splitSentencesSafe(text: string): string[] {
  const sentences: string[] = [];
  let parenDepth = 0;
  let guillemetDepth = 0;
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') {
      parenDepth += 1;
      continue;
    }
    if (ch === ')' && parenDepth > 0) {
      parenDepth -= 1;
      continue;
    }
    if (ch === '«') {
      guillemetDepth += 1;
      continue;
    }
    if (ch === '»' && guillemetDepth > 0) {
      guillemetDepth -= 1;
      continue;
    }

    if (
      (ch === '.' || ch === '!' || ch === '?') &&
      parenDepth === 0 &&
      guillemetDepth === 0 &&
      i + 1 < text.length &&
      /\s/.test(text[i + 1])
    ) {
      // Check what follows the whitespace
      let nextIdx = i + 1;
      while (nextIdx < text.length && /\s/.test(text[nextIdx])) {
        nextIdx += 1;
      }
      if (nextIdx >= text.length) continue;

      const nextChar = text[nextIdx];
      const nextStartsUpper =
        /[А-ЯІЇЄҐA-Z«\d*]/.test(nextChar);
      if (!nextStartsUpper) continue;

      if (ch === '.') {
        const beforeDot = text.slice(start, i);
        const tokenMatch = /([\p{L}\d-]+)$/u.exec(beforeDot);
        const lastToken = tokenMatch ? tokenMatch[1] : '';
        // Single uppercase letter initial like "І." or "Т."
        if (/^[А-ЯІЇЄҐA-Z]$/.test(lastToken)) continue;
        // Known abbreviation like "р.", "ст.", "Св."
        if (NON_BREAKING_ABBRS.has(lastToken.toLowerCase())) continue;
      }

      const sentence = text.slice(start, i + 1).trim();
      if (sentence) sentences.push(sentence);
      start = nextIdx;
    }
  }

  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

function groupSentences(sentences: string[], maxChunkChars: number): string[] {
  if (sentences.length <= 1) return sentences;
  const groups: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (!current) {
      current = s;
    } else if (current.length + 1 + s.length <= maxChunkChars) {
      current = `${current} ${s}`;
    } else {
      groups.push(current);
      current = s;
    }
  }
  if (current) groups.push(current);
  return groups;
}

export interface ReadableLineItem {
  prefix?: string;
  body: string;
}

export type ReadableContent =
  | { kind: 'list'; lead?: string; items: ReadableLineItem[] }
  | { kind: 'paragraphs'; paragraphs: string[] }
  | { kind: 'plain'; text: string };

export interface ReadableOptions {
  listLengthThreshold?: number;
  sentenceThreshold?: number;
  maxChunkChars?: number;
  preferListForLongText?: boolean;
}

function parseLinePrefix(line: string): ReadableLineItem {
  const dashMatch = /^(.+?)\s+—\s+([\s\S]+)$/.exec(line);
  if (dashMatch && dashMatch[1].trim().length <= 65) {
    return { prefix: dashMatch[1].trim(), body: dashMatch[2].trim() };
  }
  return { body: line };
}

export function formatReadableContent(
  text: string,
  options: ReadableOptions = {},
): ReadableContent {
  const {
    listLengthThreshold = 130,
    sentenceThreshold = 310,
    maxChunkChars = 250,
    preferListForLongText = false,
  } = options;

  const trimmed = text.trim();
  if (!trimmed) return { kind: 'plain', text: '' };

  // 1. Explicit multi-line text (e.g., structured table cells)
  if (trimmed.includes('\n')) {
    const rawLines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length > 1) {
      let lead: string | undefined;
      let itemLines = rawLines;

      if (rawLines[0].endsWith(':')) {
        lead = rawLines[0];
        itemLines = rawLines.slice(1);
      }

      const items: ReadableLineItem[] = [];
      for (const line of itemLines) {
        if (line.endsWith(':') && !line.includes('—')) {
          items.push({ prefix: line.slice(0, -1), body: '' });
          continue;
        }
        const colonFieldMatch = /^([^:«»()]{3,32}):\s+([\s\S]+)$/.exec(line);
        if (colonFieldMatch) {
          const semiParts = splitOutsideParensAndQuotes(colonFieldMatch[2]);
          if (semiParts.length >= 2) {
            items.push({ prefix: `${colonFieldMatch[1]}:`, body: semiParts[0] });
            for (const sub of semiParts.slice(1)) {
              items.push(parseLinePrefix(sub));
            }
          } else {
            items.push({ prefix: `${colonFieldMatch[1]}:`, body: colonFieldMatch[2] });
          }
          continue;
        }
        const semiParts = splitOutsideParensAndQuotes(line);
        if (semiParts.length >= 2) {
          for (const sub of semiParts) items.push(parseLinePrefix(sub));
        } else {
          items.push(parseLinePrefix(line));
        }
      }

      return { kind: 'list', lead, items };
    }
  }

  // 2. Semicolon-separated clauses outside parentheses & quotes
  const semiParts = splitOutsideParensAndQuotes(trimmed);
  const sentencesCount = splitSentencesSafe(trimmed).length;
  if (
    semiParts.length >= 3 ||
    (semiParts.length === 2 &&
      trimmed.length >= listLengthThreshold &&
      (preferListForLongText || sentencesCount <= 2))
  ) {
    let lead: string | undefined;
    const itemStrings = [...semiParts];
    const leadMatch = /^([^:«»()]{10,120}:)\s+([\s\S]+)$/.exec(itemStrings[0]);
    if (leadMatch) {
      lead = leadMatch[1];
      itemStrings[0] = leadMatch[2];
    }
    return {
      kind: 'list',
      lead,
      items: itemStrings.map(parseLinePrefix),
    };
  }

  // 3. Long prose or dense cell without semicolons -> split cleanly at sentence boundaries
  if (trimmed.length >= sentenceThreshold) {
    const sentences = splitSentencesSafe(trimmed);
    if (sentences.length >= 2) {
      if (preferListForLongText) {
        return {
          kind: 'list',
          items: sentences.map((s) => ({ body: s })),
        };
      }
      const grouped = groupSentences(sentences, maxChunkChars);
      if (grouped.length >= 2) {
        return { kind: 'paragraphs', paragraphs: grouped };
      }
    }
  }

  return { kind: 'plain', text: trimmed };
}
