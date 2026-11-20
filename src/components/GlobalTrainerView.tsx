import React, { useMemo, useState } from 'react';
import { ChevronDown, Filter, Layers, RotateCcw } from 'lucide-react';
import { Chapter } from '../types/portal';
import { getTrainerDeck } from '../utils/portalLogic';
import { FlashcardDeck } from './FlashcardDeck';

interface GlobalTrainerViewProps {
  chapters: Chapter[];
  memorizedCardIds: string[];
  onToggleMemorizedCard: (cardId: string) => void;
  onResetMemorized: () => void;
}

export const GlobalTrainerView: React.FC<GlobalTrainerViewProps> = ({
  chapters,
  memorizedCardIds,
  onToggleMemorizedCard,
  onResetMemorized,
}) => {
  const [chapterFilter, setChapterFilter] = useState<number | 'all'>('all');
  const [onlyUnmemorized, setOnlyUnmemorized] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const totalCards = useMemo(
    () => chapters.reduce((acc, ch) => acc + ch.flashcards.length, 0),
    [chapters],
  );

  const deck = useMemo(
    () => getTrainerDeck(chapters, chapterFilter, onlyUnmemorized, memorizedCardIds),
    [chapters, chapterFilter, onlyUnmemorized, memorizedCardIds],
  );

  const percentage = totalCards === 0 ? 0 : Math.round((memorizedCardIds.length / totalCards) * 100);

  return (
    <section className="mx-auto max-w-4xl space-y-6 pb-12">
      <header className="border-b border-[#E5DEC9] pb-6 dark:border-[#243047]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span>Режим випадкової перевірки · 100 карток курсу</span>
        </div>
        <h1 className="mt-2 font-editorial text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-3xl lg:text-4xl">
          Загальний тренажер (100 карток)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57534E] dark:text-[#A8B2C5] sm:text-base">
          Перевіряйте знання одразу за всіма 10 розділами або фільтруйте за обраною темою. Відмітка «Запам’ятав» зберігається автоматично.
        </p>

        {/* Global Memorization Bar */}
        <div className="mt-5 rounded-xl border border-[#DDD4BE] bg-white p-4 dark:border-[#243047] dark:bg-[#161D2B]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#57534E] dark:text-[#A8B2C5]">
            <span>Загальний прогрес тренажера</span>
            <span className="font-mono font-semibold tabular-nums text-[#1E3A8A] dark:text-[#F59E0B]">
              {memorizedCardIds.length} / {totalCards} ({percentage}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EFEAE0] dark:bg-[#243047]">
            <div
              className="h-full rounded-full bg-[#059669] transition-all duration-300 dark:bg-[#10B981]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </header>

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#DDD4BE] bg-[#F7F4EC]/75 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#243047] dark:bg-[#161D2B]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="h-4 w-4 shrink-0 text-[#57534E] dark:text-[#94A3B8]" aria-hidden="true" />
            <label htmlFor="trainer-chapter-select" className="text-xs font-semibold text-[#1C1917] dark:text-[#F4F1EA] shrink-0">
              Розділ:
            </label>
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="trainer-chapter-select"
                value={chapterFilter === 'all' ? 'all' : String(chapterFilter)}
                onChange={(e) => {
                  const val = e.target.value;
                  setChapterFilter(val === 'all' ? 'all' : Number(val));
                }}
                className="h-10 w-full appearance-none rounded-lg border border-[#DDD4BE] bg-white pl-3 pr-8 text-xs font-medium text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#F4F1EA] sm:max-w-[280px]"
              >
                <option value="all">Усі розділи (100 карток)</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={String(ch.id)}>
                    Розділ {ch.id}: {ch.shortTitle}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#57534E] dark:text-[#94A3B8]"
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOnlyUnmemorized((prev) => !prev)}
            aria-pressed={onlyUnmemorized}
            className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              onlyUnmemorized
                ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-[#F59E0B] dark:bg-[#F59E0B] dark:text-[#0F141E]'
                : 'border-[#DDD4BE] bg-white text-[#1C1917] hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#E2E8F0] dark:hover:bg-[#1D2638]'
            }`}
          >
            {onlyUnmemorized ? 'Лише невивчені: Увімкнено' : 'Лише невивчені'}
          </button>
        </div>

        {memorizedCardIds.length > 0 && (
          <div className="flex items-center gap-2">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#DDD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#57534E] transition-colors hover:text-[#DC2626] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#A8B2C5] dark:hover:text-[#F87171] whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Скинути прогрес</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetMemorized();
                    setConfirmReset(false);
                  }}
                  className="min-h-[40px] rounded-lg bg-[#DC2626] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#B91C1C] whitespace-nowrap"
                >
                  Підтвердити скидання
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[40px] rounded-lg border border-[#DDD4BE] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#F4F1EA] whitespace-nowrap"
                >
                  Скасувати
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flashcard Deck */}
      <FlashcardDeck
        cards={deck}
        memorizedIds={memorizedCardIds}
        onToggleMemorized={onToggleMemorizedCard}
        showChapterLabel
      />
    </section>
  );
};
