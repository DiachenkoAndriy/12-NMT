import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, HISTORICAL_FIGURES, TIMELINE_EVENTS } from '../data/courseData';
import { NMT_QUIZ_QUESTIONS } from '../data/quizData';
import {
  buildQuizQuestions,
  calculateProgress,
  calculateQuizStats,
  estimateReadingMinutes,
  filterFigures,
  filterTimeline,
  formatReadableContent,
  getFigureInitials,
  getTrainerDeck,
  parseBoldSegments,
  parseStructuredCellLines,
  parseStructuredListItem,
  searchPortal,
  shuffleFlashcards,
  splitOutsideParensAndQuotes,
  splitSentencesSafe,
  stripMarkdownBold,
} from './portalLogic';

test('course integrity: exactly 10 chapters and 100 flashcards (10 per chapter)', () => {
  assert.equal(CHAPTERS.length, 10);
  let totalCards = 0;
  for (const chapter of CHAPTERS) {
    assert.equal(chapter.flashcards.length, 10, `Chapter ${chapter.id} must have 10 flashcards`);
    assert.ok(chapter.sections.length >= 3, `Chapter ${chapter.id} must have detailed sections`);
    assert.ok(chapter.quotes.length >= 3, `Chapter ${chapter.id} must have historical quotes`);
    assert.ok(chapter.dates.length >= 4, `Chapter ${chapter.id} must have key dates`);
    assert.ok(chapter.terms.length >= 3, `Chapter ${chapter.id} must have terms`);
    assert.ok(chapter.figures.length >= 2, `Chapter ${chapter.id} must have figures`);
    assert.ok(chapter.trapSummary.items.length >= 2, `Chapter ${chapter.id} must have NMT traps`);
    totalCards += chapter.flashcards.length;
  }
  assert.equal(totalCards, 100);
  assert.ok(TIMELINE_EVENTS.length >= 30);
  assert.ok(HISTORICAL_FIGURES.length >= 25);
});

test('inline visual inserts: every chapter has verified figure/gallery blocks with metadata', () => {
  let totalImages = 0;
  for (const chapter of CHAPTERS) {
    const urls: string[] = [];
    for (const sec of chapter.sections) {
      for (const block of sec.blocks) {
        if (block.type === 'figure') {
          assert.ok(block.src.startsWith('https://'), `Ch ${chapter.id} figure must use https`);
          assert.ok(Boolean(block.title && block.title.trim().length > 0));
          assert.ok(block.alt.trim().length > 0);
          assert.ok(block.caption.trim().length > 0);
          urls.push(block.src);
        } else if (block.type === 'gallery') {
          assert.ok(block.items.length >= 2, `Ch ${chapter.id} gallery must have >= 2 items`);
          for (const item of block.items) {
            assert.ok(item.src.startsWith('https://'), `Ch ${chapter.id} gallery item must use https`);
            assert.ok(Boolean(item.title && item.title.trim().length > 0));
            assert.ok(item.alt.trim().length > 0);
            assert.ok(item.caption.trim().length > 0);
            urls.push(item.src);
          }
        }
      }
    }
    assert.ok(urls.length >= 6, `Chapter ${chapter.id} should have at least 6 inline visual inserts`);
    assert.equal(new Set(urls).size, urls.length, `Chapter ${chapter.id} should not duplicate image URLs`);
    totalImages += urls.length;
  }
  assert.ok(totalImages >= 85, `Expected at least 85 inline historical images, got ${totalImages}`);
});

test('global search finds dates, figures, terms, and quotes across all 10 chapters', () => {
  const byDate = searchPortal('1846', CHAPTERS);
  assert.ok(byDate.length > 0);
  assert.ok(byDate.some((r) => r.chapterId === 5));

  const byFigure = searchPortal('Кармалюк', CHAPTERS);
  assert.ok(byFigure.length > 0);
  assert.ok(byFigure.some((r) => r.chapterId === 4 && r.kind === 'Персоналія'));

  const byTerm = searchPortal('порто-франко', CHAPTERS);
  assert.ok(byTerm.length > 0);
  assert.ok(byTerm.some((r) => r.chapterId === 3 || r.chapterId === 10));

  const byQuote = searchPortal('Оренбурзький', CHAPTERS);
  assert.ok(byQuote.length > 0);
  assert.ok(byQuote.some((r) => r.chapterId === 5));

  assert.equal(searchPortal('а', CHAPTERS).length, 0);
});

test('timeline filtering works by query, category, and decade', () => {
  const all = filterTimeline(TIMELINE_EVENTS, '', 'Усі');
  assert.equal(all.length, TIMELINE_EVENTS.length);

  const war1812 = filterTimeline(TIMELINE_EVENTS, 'Бухарест', 'Геополітика та війни');
  assert.ok(war1812.length >= 1);
  assert.ok(war1812.every((ev) => ev.category === 'Геополітика та війни'));

  const decade1830 = filterTimeline(TIMELINE_EVENTS, '', 'Усі', '1830-ті');
  assert.ok(decade1830.length >= 4);
  assert.ok(decade1830.every((ev) => ev.sortYear >= 1830 && ev.sortYear < 1840));

  const none = filterTimeline(TIMELINE_EVENTS, 'неіснуюча_подія_12345', 'Усі');
  assert.equal(none.length, 0);
});

test('figures filtering and monogram initials work properly', () => {
  const artists = filterFigures(HISTORICAL_FIGURES, 'Рішельє', 'Мистецтво та архітектура');
  assert.equal(artists.length, 1);
  assert.equal(artists[0].name, 'Мартос Іван');

  assert.equal(getFigureInitials('Шевченко Тарас'), 'ШТ');
  assert.equal(getFigureInitials('Симиренко Федір та Яхненко Кіндрат'), 'СФ');
});

test('progress calculation deduplicates and bounds chapter IDs', () => {
  assert.deepEqual(calculateProgress([], 10), {
    completedCount: 0,
    totalCount: 10,
    percentage: 0,
  });
  assert.deepEqual(calculateProgress([1, 2, 2, 99], 10), {
    completedCount: 2,
    totalCount: 10,
    percentage: 20,
  });
});

test('trainer deck filtering and shuffling work properly', () => {
  const fullDeck = getTrainerDeck(CHAPTERS, 'all', false, []);
  assert.equal(fullDeck.length, 100);

  const ch4Deck = getTrainerDeck(CHAPTERS, 4, false, []);
  assert.equal(ch4Deck.length, 10);

  const filteredDeck = getTrainerDeck(CHAPTERS, 4, true, ['fc-4-1', 'fc-4-2']);
  assert.equal(filteredDeck.length, 8);

  const shuffled = shuffleFlashcards(ch4Deck);
  assert.equal(shuffled.length, 10);
  assert.deepEqual(
    shuffled.map((c) => c.id).sort(),
    ch4Deck.map((c) => c.id).sort(),
  );
});

test('quiz integrity and scoring calculate NMT score and weak chapters', () => {
  assert.equal(NMT_QUIZ_QUESTIONS.length, 30);
  const ids = new Set(NMT_QUIZ_QUESTIONS.map((q) => q.id));
  assert.equal(ids.size, 30);

  for (let ch = 1; ch <= 10; ch += 1) {
    const chQuestions = buildQuizQuestions(NMT_QUIZ_QUESTIONS, ch);
    assert.equal(chQuestions.length, 3, `Chapter ${ch} should have 3 NMT quiz questions`);
    for (const q of chQuestions) {
      assert.equal(q.options.length, 4);
      assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
      assert.ok(q.explanation.trim().length > 10);
    }
  }

  const blitz = buildQuizQuestions(NMT_QUIZ_QUESTIONS, 'all', 10, true);
  assert.equal(blitz.length, 10);

  const sample = NMT_QUIZ_QUESTIONS.slice(0, 4);
  const answers: Record<string, number> = {
    [sample[0].id]: sample[0].correctIndex,
    [sample[1].id]: sample[1].correctIndex,
    [sample[2].id]: (sample[2].correctIndex + 1) % 4,
    [sample[3].id]: (sample[3].correctIndex + 1) % 4,
  };
  const stats = calculateQuizStats(sample, answers);
  assert.equal(stats.answeredCount, 4);
  assert.equal(stats.correctCount, 2);
  assert.equal(stats.percentage, 50);
  assert.equal(stats.nmtScaledScore, 150);
  assert.ok(stats.weakChapterIds.length >= 1);
});

test('parseBoldSegments and stripMarkdownBold parse NMT marker syntax accurately', () => {
  const raw = 'Подія **1798 р.** — поема **«Енеїда»** І. Котляревського.';
  assert.equal(stripMarkdownBold(raw), 'Подія 1798 р. — поема «Енеїда» І. Котляревського.');
  const segments = parseBoldSegments(raw);
  assert.deepEqual(segments, [
    { text: 'Подія ', bold: false },
    { text: '1798 р.', bold: true },
    { text: ' — поема ', bold: false },
    { text: '«Енеїда»', bold: true },
    { text: ' І. Котляревського.', bold: false },
  ]);
});

test('parseStructuredListItem extracts heading and body for structured editorial cards', () => {
  assert.deepEqual(
    parseStructuredListItem('**Правобережна Україна (3 губернії):** Київська, Подільська та Волинська губернії.'),
    {
      heading: 'Правобережна Україна (3 губернії)',
      body: 'Київська, Подільська та Волинська губернії.',
    },
  );
  assert.deepEqual(
    parseStructuredListItem('**1831–1835 рр.** — скасування магдебурзького права в містах України.'),
    {
      heading: '1831–1835 рр.',
      body: 'скасування магдебурзького права в містах України.',
    },
  );
  assert.equal(parseStructuredListItem('Звичайний пункт списку без виділеного заголовка.'), null);
});

test('estimateReadingMinutes and theory sectionId search work accurately', () => {
  for (const ch of CHAPTERS) {
    const mins = estimateReadingMinutes(ch);
    assert.ok(mins >= 3 && mins <= 30, `Chapter ${ch.id} reading time should be reasonable, got ${mins}`);
  }

  const theoryHits = searchPortal('Геополітичний поділ', CHAPTERS).filter((r) => r.kind === 'Теорія');
  assert.ok(theoryHits.length >= 1);
  assert.ok(Boolean(theoryHits[0].sectionId));
});

test('parseStructuredCellLines formats dense table cells while preserving every word of text', () => {
  assert.equal(parseStructuredCellLines('Звичайна комірка без переносів'), null);

  const ch1Table = CHAPTERS[0].sections[0].blocks.find((b) => b.type === 'table');
  assert.ok(ch1Table && ch1Table.type === 'table');
  const southCell = ch1Table.rows[2][2];
  const parsed = parseStructuredCellLines(southCell);
  assert.ok(parsed);
  assert.ok(parsed.lead?.endsWith(':'));
  assert.equal(parsed.items.length, 4);
  assert.equal(parsed.items[0].prefix, '1768–1774 рр. (Кючук-Кайнарджійський мир)');
  assert.equal(parsed.items[2].prefix, '1783 р.');

  const reconstructed = [
    parsed.lead,
    ...parsed.items.map((it) => (it.prefix ? `${it.prefix} — ${it.body}` : it.body)),
  ]
    .filter(Boolean)
    .join(' ');
  assert.equal(reconstructed, southCell.replace(/\n/g, ' '));
});

test('site-wide readable formatting unpacks dense blocks without losing a single word', () => {
  // Parentheses and guillemets guard
  const parenSample = 'Перший етап (Харків; Полтава); другий етап «Київ; Львів»; третій етап.';
  assert.equal(splitOutsideParensAndQuotes(parenSample).length, 3);

  // Abbreviation & initial guard
  const proseWithAbbr =
    'І. Котляревський у 1798 р. видав «Енеїду», а Т. Шевченко у XIX ст. написав «Кобзар». Нова українська література здобула світове визнання.';
  const sentences = splitSentencesSafe(proseWithAbbr);
  assert.equal(sentences.length, 2);
  assert.ok(sentences[0].includes('І. Котляревський'));
  assert.ok(sentences[0].includes('Т. Шевченко'));

  // Helper to flatten any FormattedResult back to tokens and confirm exact word preservation
  const normalizeWords = (s: string) => s.replace(/\s+/g, ' ').trim();
  const flattenFormatted = (raw: string, opts?: Parameters<typeof formatReadableContent>[1]) => {
    const res = formatReadableContent(raw, opts);
    if (res.kind === 'plain') return normalizeWords(res.text);
    if (res.kind === 'paragraphs') return normalizeWords(res.paragraphs.join(' '));
    const chunks: string[] = [];
    if (res.lead) chunks.push(res.lead);
    for (const item of res.items) {
      if (item.prefix && item.body === '') {
        chunks.push(`${item.prefix}:`);
      } else if (item.prefix) {
        const sep = item.prefix.endsWith(':') ? ' ' : ' — ';
        chunks.push(`${item.prefix}${sep}${item.body}`);
      } else {
        chunks.push(item.body);
      }
    }
    return normalizeWords(chunks.join(' '));
  };

  // Verify every paragraph, list item, table cell, trap, timeline event, figure, and flashcard preserves 100% of words
  for (const ch of CHAPTERS) {
    for (const sec of ch.sections) {
      for (const b of sec.blocks) {
        if (b.type === 'paragraph') {
          assert.equal(flattenFormatted(b.text, { sentenceThreshold: 340 }), normalizeWords(b.text));
        } else if (b.type === 'table') {
          for (const row of b.rows) {
            for (const cell of row) {
              assert.equal(
                flattenFormatted(cell, { sentenceThreshold: 195, listLengthThreshold: 110, preferListForLongText: true }),
                normalizeWords(cell),
              );
            }
          }
        } else if (b.type === 'list') {
          for (const item of b.items) {
            assert.equal(flattenFormatted(item, { sentenceThreshold: 270 }), normalizeWords(item));
          }
        }
      }
    }
    for (const fc of ch.flashcards) {
      assert.equal(
        flattenFormatted(fc.answer, { listLengthThreshold: 90, sentenceThreshold: 230, preferListForLongText: true }),
        normalizeWords(fc.answer),
      );
    }
  }
  for (const ev of TIMELINE_EVENTS) {
    assert.equal(
      flattenFormatted(ev.event, { listLengthThreshold: 100, sentenceThreshold: 230, preferListForLongText: true }),
      normalizeWords(ev.event),
    );
  }
  for (const fig of HISTORICAL_FIGURES) {
    assert.equal(
      flattenFormatted(fig.achievements, { listLengthThreshold: 100, sentenceThreshold: 230, preferListForLongText: true }),
      normalizeWords(fig.achievements),
    );
  }

  // Confirm dense items actually unpack into structured lists or multi-paragraphs
  const ch5StageRow = CHAPTERS[4].sections[0].blocks.find((b) => b.type === 'table');
  assert.ok(ch5StageRow && ch5StageRow.type === 'table');
  const stageFormatted = formatReadableContent(ch5StageRow.rows[0][2], {
    sentenceThreshold: 195,
    listLengthThreshold: 110,
    preferListForLongText: true,
  });
  assert.equal(stageFormatted.kind, 'list');
  if (stageFormatted.kind === 'list') {
    assert.ok(stageFormatted.items.length >= 4);
  }

  const ch5DecembristPara = CHAPTERS[4].sections[3].blocks[4];
  assert.ok(ch5DecembristPara.type === 'paragraph');
  const paraFormatted = formatReadableContent(ch5DecembristPara.text, { sentenceThreshold: 340 });
  assert.equal(paraFormatted.kind, 'paragraphs');
  if (paraFormatted.kind === 'paragraphs') {
    assert.ok(paraFormatted.paragraphs.length >= 2);
  }
});
