import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, RotateCw, Shuffle } from 'lucide-react';
import { Flashcard } from '../types/portal';
import { shuffleFlashcards } from '../utils/portalLogic';

interface FlashcardDeckProps {
  cards: Flashcard[];
  memorizedIds: string[];
  onToggleMemorized: (cardId: string) => void;
  title?: string;
  showChapterLabel?: boolean;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  cards,
  memorizedIds,
  onToggleMemorized,
  title,
  showChapterLabel = false,
}) => {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  if (deck.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5DEC9] bg-white p-8 text-center dark:border-[#243047] dark:bg-[#161D2B]">
        <p className="text-base font-medium text-[#1C1917] dark:text-[#F4F1EA]">
          У цій вибірці немає карток.
        </p>
        <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8B2C5]">
          Ви вже запам’ятали всі картки або змініть фільтр розділів.
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, deck.length - 1);
  const currentCard = deck[safeIndex];
  const isMemorized = memorizedIds.includes(currentCard.id);
  const memorizedInDeckCount = deck.filter((c) => memorizedIds.includes(c.id)).length;

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev === 0 ? deck.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev === deck.length - 1 ? 0 : prev + 1));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setDeck((prev) => shuffleFlashcards(prev));
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Header & Deck Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && (
            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
              {title}
            </h3>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8B2C5] tabular-nums">
            <span>
              Картка <strong className="text-[#1C1917] dark:text-[#F4F1EA]">{safeIndex + 1}</strong> з{' '}
              <strong className="text-[#1C1917] dark:text-[#F4F1EA]">{deck.length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Запам’ятовано:{' '}
              <strong className="text-[#059669] dark:text-[#34D399]">
                {memorizedInDeckCount}/{deck.length}
              </strong>
            </span>
            {showChapterLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span>Розділ {currentCard.chapterId}</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#DDD4BE] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] whitespace-nowrap shrink-0"
        >
          <Shuffle className="h-4 w-4 text-[#1E3A8A] dark:text-[#F59E0B]" />
          <span>Перемішати</span>
        </button>
      </div>

      {/* 3D Flippable Flashcard */}
      <div className="perspective-1000">
        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          aria-pressed={isFlipped}
          aria-label={
            isFlipped
              ? `Відповідь на картку ${safeIndex + 1}. Натисніть, щоб повернути до питання`
              : `Питання картки ${safeIndex + 1}. Натисніть, щоб переглянути відповідь`
          }
          className={`relative block min-h-[250px] w-full cursor-pointer text-left transition-transform duration-500 transform-style-3d focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A] sm:min-h-[270px] ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front: Question */}
          <div
            className={`backface-hidden absolute inset-0 flex flex-col justify-between rounded-2xl border p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] sm:p-8 ${
              isMemorized
                ? 'border-[#059669]/40 bg-white dark:border-[#10B981]/40 dark:bg-[#161D2B]'
                : 'border-[#DDD4BE] bg-white dark:border-[#2A354D] dark:bg-[#161D2B]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#78716C] dark:text-[#94A3B8]">
              <span>Питання · Натисніть картку, щоб перевернути</span>
              {isMemorized && (
                <span className="font-semibold text-[#059669] dark:text-[#34D399]">Запам’ятовано</span>
              )}
            </div>

            <div className="my-auto py-4 text-center">
              <p className="font-editorial text-lg font-semibold leading-snug text-[#1C1917] dark:text-[#F4F1EA] sm:text-xl lg:text-2xl">
                {currentCard.question}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#1E3A8A] dark:text-[#F59E0B]">
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Показати відповідь</span>
            </div>
          </div>

          {/* Back: Answer */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#1E3A8A]/35 bg-[#F4F6FB] p-6 shadow-[0_4px_20px_rgb(30,58,138,0.06)] sm:p-8 dark:border-[#F59E0B]/40 dark:bg-[#1A2438]">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#1E3A8A] dark:text-[#F59E0B]">
              <span>Еталонна відповідь НМТ</span>
              {isMemorized && (
                <span className="font-semibold text-[#059669] dark:text-[#34D399]">Запам’ятовано</span>
              )}
            </div>

            <div className="my-auto py-4 text-center">
              <p className="text-base font-medium leading-relaxed text-[#1C1917] dark:text-[#F4F1EA] sm:text-lg">
                {currentCard.answer}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#57534E] dark:text-[#A8B2C5]">
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Повернути до питання</span>
            </div>
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#DDD4BE] bg-white px-4 py-2 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:flex-initial dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] whitespace-nowrap"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Попередня</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#DDD4BE] bg-white px-4 py-2 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:flex-initial dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] whitespace-nowrap"
          >
            <span>Наступна</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onToggleMemorized(currentCard.id)}
          aria-pressed={isMemorized}
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:w-auto whitespace-nowrap ${
            isMemorized
              ? 'border border-[#059669]/40 bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5] dark:border-[#10B981]/40 dark:bg-[#064E3B]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/70'
              : 'bg-[#1E3A8A] text-white hover:bg-[#172554] dark:bg-[#F59E0B] dark:text-[#0F141E] dark:hover:bg-[#D97706]'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{isMemorized ? 'Запам’ятав (зняти)' : 'Запам’ятав'}</span>
        </button>
      </div>
    </div>
  );
};
