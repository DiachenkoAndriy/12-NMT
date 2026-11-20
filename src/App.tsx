import { useEffect, useMemo, useState } from 'react';
import { CHAPTERS, HISTORICAL_FIGURES, TIMELINE_EVENTS } from './data/courseData';
import { ActiveView, SearchResult } from './types/portal';
import { calculateProgress, searchPortal } from './utils/portalLogic';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChapterView } from './components/ChapterView';
import { TimelineView } from './components/TimelineView';
import { FiguresView } from './components/FiguresView';
import { GlobalTrainerView } from './components/GlobalTrainerView';

const STORAGE_KEYS = {
  theme: 'nmt_portal_theme_v1',
  completedChapters: 'nmt_portal_completed_chapters_v1',
  memorizedCards: 'nmt_portal_memorized_cards_v1',
};

function readStoredIds<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS.theme) === 'dark';
    } catch {
      return false;
    }
  });

  const [completedChapterIds, setCompletedChapterIds] = useState<number[]>(() =>
    readStoredIds<number>(STORAGE_KEYS.completedChapters, []),
  );

  const [memorizedCardIds, setMemorizedCardIds] = useState<string[]>(() =>
    readStoredIds<string>(STORAGE_KEYS.memorizedCards, []),
  );

  const [activeView, setActiveView] = useState<ActiveView>({ type: 'chapter', chapterId: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync dark mode class on <html> and persist
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  // Persist completed chapters
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.completedChapters,
        JSON.stringify(completedChapterIds),
      );
    } catch {
      // ignore storage errors
    }
  }, [completedChapterIds]);

  // Persist memorized flashcards
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.memorizedCards, JSON.stringify(memorizedCardIds));
    } catch {
      // ignore storage errors
    }
  }, [memorizedCardIds]);

  const searchResults = useMemo(
    () => searchPortal(searchQuery, CHAPTERS),
    [searchQuery],
  );

  const progress = useMemo(
    () => calculateProgress(completedChapterIds, CHAPTERS.length),
    [completedChapterIds],
  );

  const totalFlashcards = useMemo(
    () => CHAPTERS.reduce((sum, ch) => sum + ch.flashcards.length, 0),
    [],
  );

  const handleToggleChapterComplete = (chapterId: number) => {
    setCompletedChapterIds((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId],
    );
  };

  const handleToggleMemorizedCard = (cardId: string) => {
    setMemorizedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId],
    );
  };

  const handleSelectView = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChapter = (chapterId: number) => {
    setActiveView({ type: 'chapter', chapterId });
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    setActiveView({ type: 'chapter', chapterId: result.chapterId });
    setIsMobileMenuOpen(false);

    window.setTimeout(() => {
      let anchorId = '';
      if (result.kind === 'Цитата') anchorId = `ch-${result.chapterId}-quotes`;
      else if (result.kind === 'Пастка НМТ') anchorId = `ch-${result.chapterId}-traps`;
      else if (result.kind === 'Дата' || result.kind === 'Термін' || result.kind === 'Персоналія') {
        anchorId = `ch-${result.chapterId}-reference`;
      } else if (result.kind === 'Флеш-картка') {
        anchorId = `ch-${result.chapterId}-flashcards`;
      }

      if (anchorId) {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 60);
  };

  const activeChapter =
    activeView.type === 'chapter'
      ? CHAPTERS.find((c) => c.id === activeView.chapterId) ?? CHAPTERS[0]
      : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF9F5] text-[#1C1917] transition-colors duration-200 dark:bg-[#0F141E] dark:text-[#F4F1EA]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSelectSearchResult={handleSelectSearchResult}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        completedCount={progress.completedCount}
        totalChapters={progress.totalCount}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      <div className="mx-auto flex max-w-[1440px]">
        <Sidebar
          chapters={CHAPTERS}
          activeView={activeView}
          onSelectView={handleSelectView}
          completedChapterIds={completedChapterIds}
          onToggleChapterComplete={handleToggleChapterComplete}
          memorizedCount={memorizedCardIds.length}
          totalFlashcards={totalFlashcards}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
          {activeView.type === 'chapter' && activeChapter && (
            <ChapterView
              chapter={activeChapter}
              totalChapters={CHAPTERS.length}
              isCompleted={completedChapterIds.includes(activeChapter.id)}
              onToggleComplete={handleToggleChapterComplete}
              onNavigateChapter={handleOpenChapter}
              memorizedCardIds={memorizedCardIds}
              onToggleMemorizedCard={handleToggleMemorizedCard}
            />
          )}

          {activeView.type === 'timeline' && (
            <TimelineView events={TIMELINE_EVENTS} onOpenChapter={handleOpenChapter} />
          )}

          {activeView.type === 'figures' && (
            <FiguresView figures={HISTORICAL_FIGURES} onOpenChapter={handleOpenChapter} />
          )}

          {activeView.type === 'trainer' && (
            <GlobalTrainerView
              chapters={CHAPTERS}
              memorizedCardIds={memorizedCardIds}
              onToggleMemorizedCard={handleToggleMemorizedCard}
              onResetMemorized={() => setMemorizedCardIds([])}
            />
          )}

          <footer className="mx-auto mt-12 max-w-4xl border-t border-[#E5DEC9] pt-6 text-center text-xs text-[#78716C] dark:border-[#243047] dark:text-[#8B97AD]">
            Навчальний портал підготовки до НМТ з історії України · Тема 12: Українські землі у складі Російської імперії наприкінці XVIII — в першій половині XIX ст.
          </footer>
        </main>
      </div>
    </div>
  );
}
