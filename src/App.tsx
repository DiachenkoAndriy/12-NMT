import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { CHAPTERS, HISTORICAL_FIGURES, TIMELINE_EVENTS } from './data/courseData';
import { NMT_QUIZ_QUESTIONS } from './data/quizData';
import { ActiveView, SearchResult } from './types/portal';
import { calculateProgress, searchPortal } from './utils/portalLogic';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChapterView } from './components/ChapterView';
import { TimelineView } from './components/TimelineView';
import { FiguresView } from './components/FiguresView';
import { GlobalTrainerView } from './components/GlobalTrainerView';
import { NmtQuizView } from './components/NmtQuizView';

const STORAGE_KEYS = {
  theme: 'nmt_portal_theme_v1',
  completedChapters: 'nmt_portal_completed_chapters_v1',
  memorizedCards: 'nmt_portal_memorized_cards_v1',
  activeView: 'nmt_portal_active_view_v1',
  bestQuiz: 'nmt_portal_best_quiz_v1',
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

function readStoredView(): ActiveView {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.activeView);
    if (!raw) return { type: 'chapter', chapterId: 1 };
    const parsed = JSON.parse(raw) as ActiveView;
    if (
      parsed &&
      (parsed.type === 'timeline' ||
        parsed.type === 'figures' ||
        parsed.type === 'trainer' ||
        parsed.type === 'quiz')
    ) {
      return parsed;
    }
    if (
      parsed &&
      parsed.type === 'chapter' &&
      typeof parsed.chapterId === 'number' &&
      parsed.chapterId >= 1 &&
      parsed.chapterId <= CHAPTERS.length
    ) {
      return { type: 'chapter', chapterId: parsed.chapterId };
    }
    return { type: 'chapter', chapterId: 1 };
  } catch {
    return { type: 'chapter', chapterId: 1 };
  }
}

function readBestQuiz(): { percentage: number; nmtScaledScore: number } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.bestQuiz);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.percentage === 'number' &&
      typeof parsed.nmtScaledScore === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
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

  const [activeView, setActiveView] = useState<ActiveView>(() => readStoredView());
  const [bestQuizResult, setBestQuizResult] = useState<{
    percentage: number;
    nmtScaledScore: number;
  } | null>(() => readBestQuiz());
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [requestedRefTab, setRequestedRefTab] = useState<{
    chapterId: number;
    tab: 'dates' | 'terms' | 'figures';
    seq: number;
  } | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  // Persist active view
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.activeView, JSON.stringify(activeView));
    } catch {
      // ignore storage errors
    }
  }, [activeView]);

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

  const handleSaveQuizResult = (percentage: number, nmtScaledScore: number) => {
    setBestQuizResult((prev) => {
      if (prev && prev.percentage >= percentage) {
        return prev;
      }
      const next = { percentage, nmtScaledScore };
      try {
        window.localStorage.setItem(STORAGE_KEYS.bestQuiz, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
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

  const handleStartChapterQuiz = (chapterId: number) => {
    setActiveView({ type: 'quiz', initialChapterId: chapterId });
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    setActiveView({ type: 'chapter', chapterId: result.chapterId });
    setIsMobileMenuOpen(false);

    if (result.kind === 'Дата') {
      setRequestedRefTab((prev) => ({ chapterId: result.chapterId, tab: 'dates', seq: (prev?.seq ?? 0) + 1 }));
    } else if (result.kind === 'Термін') {
      setRequestedRefTab((prev) => ({ chapterId: result.chapterId, tab: 'terms', seq: (prev?.seq ?? 0) + 1 }));
    } else if (result.kind === 'Персоналія') {
      setRequestedRefTab((prev) => ({ chapterId: result.chapterId, tab: 'figures', seq: (prev?.seq ?? 0) + 1 }));
    }

    window.setTimeout(() => {
      let anchorId = '';
      if (result.kind === 'Цитата') anchorId = `ch-${result.chapterId}-quotes`;
      else if (result.kind === 'Пастка НМТ') anchorId = `ch-${result.chapterId}-traps`;
      else if (result.kind === 'Дата' || result.kind === 'Термін' || result.kind === 'Персоналія') {
        anchorId = `ch-${result.chapterId}-reference`;
      } else if (result.kind === 'Флеш-картка') {
        anchorId = `ch-${result.chapterId}-flashcards`;
      } else if (result.kind === 'Теорія' && result.sectionId) {
        anchorId = result.sectionId;
      }

      if (anchorId) {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  };

  const handleReadProgressChange = useCallback((pct: number) => {
    setReadingProgress(pct);
  }, []);

  const activeChapter =
    activeView.type === 'chapter'
      ? CHAPTERS.find((c) => c.id === activeView.chapterId) ?? CHAPTERS[0]
      : null;

  const prevChapterTitle = activeChapter
    ? CHAPTERS.find((c) => c.id === activeChapter.id - 1)?.shortTitle
    : undefined;
  const nextChapterTitle = activeChapter
    ? CHAPTERS.find((c) => c.id === activeChapter.id + 1)?.shortTitle
    : undefined;

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
        readingProgress={activeView.type === 'chapter' ? readingProgress : null}
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
          bestQuizPercentage={bestQuizResult?.percentage ?? null}
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
              onStartChapterQuiz={handleStartChapterQuiz}
              prevChapterTitle={prevChapterTitle}
              nextChapterTitle={nextChapterTitle}
              requestedRefTab={requestedRefTab}
              memorizedCardIds={memorizedCardIds}
              onToggleMemorizedCard={handleToggleMemorizedCard}
              onReadProgressChange={handleReadProgressChange}
            />
          )}

          {activeView.type === 'quiz' && (
            <NmtQuizView
              questions={NMT_QUIZ_QUESTIONS}
              chapters={CHAPTERS}
              initialChapterId={activeView.initialChapterId}
              bestScore={bestQuizResult}
              onSaveResult={handleSaveQuizResult}
              onOpenChapter={handleOpenChapter}
            />
          )}

          {activeView.type === 'timeline' && (
            <TimelineView events={TIMELINE_EVENTS} onOpenChapter={handleOpenChapter} />
          )}

          {activeView.type === 'figures' && (
            <FiguresView
              figures={HISTORICAL_FIGURES}
              chapters={CHAPTERS}
              onOpenChapter={handleOpenChapter}
            />
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

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Повернутися до гори сторінки"
          title="До гори"
          className="fixed right-4 bottom-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#DDD4BE] bg-white/95 text-[#1E3A8A] shadow-lg backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:right-6 sm:bottom-6 dark:border-[#2A354D] dark:bg-[#161D2B]/95 dark:text-[#F59E0B] dark:hover:bg-[#1D2638]"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
