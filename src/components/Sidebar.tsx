import React from 'react';
import { Calendar, Check, Layers, Users, X } from 'lucide-react';
import { ActiveView, Chapter } from '../types/portal';

interface SidebarProps {
  chapters: Chapter[];
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  completedChapterIds: number[];
  onToggleChapterComplete: (chapterId: number) => void;
  memorizedCount: number;
  totalFlashcards: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  activeView,
  onSelectView,
  completedChapterIds,
  onToggleChapterComplete,
  memorizedCount,
  totalFlashcards,
  isMobileOpen,
  onCloseMobile,
}) => {
  const completedCount = completedChapterIds.length;
  const percentage = Math.round((completedCount / chapters.length) * 100);

  const handleSelect = (view: ActiveView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-y-auto px-3.5 py-4">
      {/* Progress block */}
      <div className="mb-4 rounded-xl border border-[#E5DEC9] bg-[#F3EFE6]/70 p-3.5 dark:border-[#243047] dark:bg-[#161D2B]">
        <div className="flex items-center justify-between text-xs font-medium text-[#57534E] dark:text-[#A8B2C5]">
          <span>Прогрес вивчення</span>
          <span className="font-mono font-semibold tabular-nums text-[#1E3A8A] dark:text-[#60A5FA]">
            {completedCount}/{chapters.length} ({percentage}%)
          </span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5DEC9] dark:bg-[#243047]"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Загальний прогрес вивчення розділів"
        >
          <div
            className="h-full rounded-full bg-[#1E3A8A] transition-all duration-300 dark:bg-[#F59E0B]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-[#78716C] dark:text-[#8B97AD] tabular-nums">
          Флеш-картки: {memorizedCount} з {totalFlashcards} запам’ятовано
        </div>
      </div>

      {/* Special interactive tabs */}
      <div className="mb-4">
        <div className="mb-1.5 px-2 text-xs font-semibold tracking-wide text-[#78716C] dark:text-[#8B97AD]">
          Інструменти та довідники
        </div>
        <nav aria-label="Додаткові розділи порталу" className="space-y-0.5">
          <button
            type="button"
            onClick={() => handleSelect({ type: 'timeline' })}
            className={`flex min-h-[44px] lg:min-h-[38px] w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-[13.5px] font-medium transition-colors ${
              activeView.type === 'timeline'
                ? 'bg-[#1E3A8A] text-white dark:bg-[#F59E0B] dark:text-[#0F141E]'
                : 'text-[#1C1917] hover:bg-[#EFEAE0] dark:text-[#E2E8F0] dark:hover:bg-[#1D2638]'
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Зведена хронологія (1791–1856)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect({ type: 'figures' })}
            className={`flex min-h-[44px] lg:min-h-[38px] w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-[13.5px] font-medium transition-colors ${
              activeView.type === 'figures'
                ? 'bg-[#1E3A8A] text-white dark:bg-[#F59E0B] dark:text-[#0F141E]'
                : 'text-[#1C1917] hover:bg-[#EFEAE0] dark:text-[#E2E8F0] dark:hover:bg-[#1D2638]'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Довідник персоналій</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect({ type: 'trainer' })}
            className={`flex min-h-[44px] lg:min-h-[38px] w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-[13.5px] font-medium transition-colors ${
              activeView.type === 'trainer'
                ? 'bg-[#1E3A8A] text-white dark:bg-[#F59E0B] dark:text-[#0F141E]'
                : 'text-[#1C1917] hover:bg-[#EFEAE0] dark:text-[#E2E8F0] dark:hover:bg-[#1D2638]'
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Загальний тренажер (100 карток)</span>
          </button>
        </nav>
      </div>

      {/* 10 Chapters List */}
      <div className="flex-1">
        <div className="mb-1.5 px-2 text-xs font-semibold tracking-wide text-[#78716C] dark:text-[#8B97AD]">
          Навчальні розділи (1–10)
        </div>
        <nav aria-label="Список 10 навчальних розділів" className="space-y-0.5">
          {chapters.map((chapter) => {
            const isActive = activeView.type === 'chapter' && activeView.chapterId === chapter.id;
            const isCompleted = completedChapterIds.includes(chapter.id);

            return (
              <div
                key={chapter.id}
                className={`group flex items-center gap-1.5 rounded-lg border transition-colors ${
                  isActive
                    ? 'border-[#1E3A8A]/30 bg-white shadow-xs dark:border-[#F59E0B]/40 dark:bg-[#1D2638]'
                    : 'border-transparent hover:bg-[#EFEAE0]/70 dark:hover:bg-[#161D2B]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect({ type: 'chapter', chapterId: chapter.id })}
                  className="flex min-h-[44px] lg:min-h-[38px] flex-1 items-start gap-2 px-2.5 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1E3A8A]"
                >
                  <span
                    className={`mt-0.5 font-mono text-xs font-semibold tabular-nums shrink-0 ${
                      isActive
                        ? 'text-[#1E3A8A] dark:text-[#F59E0B]'
                        : 'text-[#78716C] dark:text-[#8B97AD]'
                    }`}
                  >
                    {String(chapter.id).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[13px] leading-snug ${
                      isActive
                        ? 'font-semibold text-[#1E3A8A] dark:text-[#F4F1EA]'
                        : 'font-medium text-[#292524] dark:text-[#CBD5E1]'
                    }`}
                  >
                    {chapter.shortTitle}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleChapterComplete(chapter.id)}
                  aria-label={
                    isCompleted
                      ? `Зняти відмітку «Вивчено» для розділу ${chapter.id}`
                      : `Позначити розділ ${chapter.id} як вивчений`
                  }
                  aria-pressed={isCompleted}
                  title={isCompleted ? 'Вивчено' : 'Позначити як вивчений'}
                  className="mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#E5DEC9]/60 focus-visible:outline-2 focus-visible:outline-[#1E3A8A] dark:hover:bg-[#2A354D]"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      isCompleted
                        ? 'border-[#059669] bg-[#059669] text-white dark:border-[#10B981] dark:bg-[#10B981]'
                        : 'border-[#C7BEA9] bg-white dark:border-[#475569] dark:bg-[#0F141E]'
                    }`}
                  >
                    {isCompleted && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:border-r lg:border-[#E5DEC9] lg:bg-[#F7F4EC]/60 dark:lg:border-[#243047] dark:lg:bg-[#0B0F17]/60">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Навігація порталу">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col border-r border-[#E5DEC9] bg-[#FBF9F5] shadow-2xl dark:border-[#243047] dark:bg-[#0F141E]">
            <div className="flex h-16 items-center justify-between border-b border-[#E5DEC9] px-4 dark:border-[#243047]">
              <span className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#F4F1EA]">
                Зміст курсу НМТ
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Закрити навігаційне меню"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DDD4BE] bg-white text-[#1C1917] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  );
};
