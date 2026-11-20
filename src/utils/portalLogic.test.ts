import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, HISTORICAL_FIGURES, TIMELINE_EVENTS } from '../data/courseData';
import {
  calculateProgress,
  filterFigures,
  filterTimeline,
  getTrainerDeck,
  parseBoldSegments,
  parseStructuredListItem,
  searchPortal,
  shuffleFlashcards,
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

test('timeline filtering works by query and category', () => {
  const all = filterTimeline(TIMELINE_EVENTS, '', 'Усі');
  assert.equal(all.length, TIMELINE_EVENTS.length);

  const war1812 = filterTimeline(TIMELINE_EVENTS, 'Бухарест', 'Геополітика та війни');
  assert.ok(war1812.length >= 1);
  assert.ok(war1812.every((ev) => ev.category === 'Геополітика та війни'));

  const none = filterTimeline(TIMELINE_EVENTS, 'неіснуюча_подія_12345', 'Усі');
  assert.equal(none.length, 0);
});

test('figures filtering works by query and category', () => {
  const artists = filterFigures(HISTORICAL_FIGURES, 'Рішельє', 'Мистецтво та архітектура');
  assert.equal(artists.length, 1);
  assert.equal(artists[0].name, 'Мартос Іван');
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
