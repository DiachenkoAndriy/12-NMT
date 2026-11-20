import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Shuffle,
  XCircle,
} from 'lucide-react';
import { Chapter, NmtQuestion } from '../types/portal';
import { buildQuizQuestions, calculateQuizStats } from '../utils/portalLogic';
import { ReadableText } from './ReadableText';

interface NmtQuizViewProps {
  questions: NmtQuestion[];
  chapters: Chapter[];
  initialChapterId?: number;
  bestScore: { percentage: number; nmtScaledScore: number } | null;
  onSaveResult: (percentage: number, nmtScaledScore: number) => void;
  onOpenChapter: (chapterId: number) => void;
}

type QuizMode = 'blitz10' | 'full30' | 'chapter';

const OPTION_LETTERS = ['А', 'Б', 'В', 'Г'] as const;

export const NmtQuizView: React.FC<NmtQuizViewProps> = ({
  questions,
  chapters,
  initialChapterId,
  bestScore,
  onSaveResult,
  onOpenChapter,
}) => {
  const [mode, setMode] = useState<QuizMode>(() => (initialChapterId ? 'chapter' : 'blitz10'));
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => initialChapterId ?? 1);
  const [sessionSeed, setSessionSeed] = useState(1);
  const [activeQuestions, setActiveQuestions] = useState<NmtQuestion[]>(() =>
    initialChapterId
      ? buildQuizQuestions(questions, initialChapterId, undefined, false)
      : buildQuizQuestions(questions, 'all', 10, true),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [reviewOnlyMistakes, setReviewOnlyMistakes] = useState(false);

  const startSession = useCallback(
    (nextMode: QuizMode, nextChapterId = selectedChapterId) => {
      const nextList =
        nextMode === 'blitz10'
          ? buildQuizQuestions(questions, 'all', 10, true)
          : nextMode === 'full30'
            ? buildQuizQuestions(questions, 'all', undefined, true)
            : buildQuizQuestions(questions, nextChapterId, undefined, false);

      setMode(nextMode);
      setSelectedChapterId(nextChapterId);
      setActiveQuestions(nextList);
      setSelectedAnswers({});
      setCurrentIndex(0);
      setIsFinished(false);
      setReviewOnlyMistakes(false);
      setSessionSeed((s) => s + 1);
    },
    [questions, selectedChapterId],
  );

  useEffect(() => {
    if (typeof initialChapterId === 'number' && initialChapterId >= 1 && initialChapterId <= 10) {
      startSession('chapter', initialChapterId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChapterId]);

  const stats = useMemo(
    () => calculateQuizStats(activeQuestions, selectedAnswers),
    [activeQuestions, selectedAnswers],
  );

  const currentQuestion = activeQuestions[currentIndex] ?? null;
  const currentSelected = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const hasAnsweredCurrent = typeof currentSelected === 'number';

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion || hasAnsweredCurrent) return;
      const nextAnswers = {
        ...selectedAnswers,
        [currentQuestion.id]: optionIndex,
      };
      setSelectedAnswers(nextAnswers);

      const updatedStats = calculateQuizStats(activeQuestions, nextAnswers);
      if (updatedStats.answeredCount === activeQuestions.length) {
        onSaveResult(updatedStats.percentage, updatedStats.nmtScaledScore);
      }
    },
    [currentQuestion, hasAnsweredCurrent, selectedAnswers, activeQuestions, onSaveResult],
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onSaveResult(stats.percentage, stats.nmtScaledScore);
      setIsFinished(true);
    }
  }, [currentIndex, activeQuestions.length, onSaveResult, stats.percentage, stats.nmtScaledScore]);

  // Keyboard shortcuts (1-4 to pick А-Г, Enter/ArrowRight for next question)
  useEffect(() => {
    if (isFinished || !currentQuestion) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (!hasAnsweredCurrent && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        handleSelectOption(Number(e.key) - 1);
      } else if (hasAnsweredCurrent && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFinished, currentQuestion, hasAnsweredCurrent, handleSelectOption, handleNext]);

  const getChapterShortTitle = (chapterId: number) =>
    chapters.find((c) => c.id === chapterId)?.shortTitle ?? `Розділ ${chapterId}`;

  const mistakeCount = stats.totalCount - stats.correctCount;
  const visibleReviewQuestions = useMemo(() => {
    const withIdx = activeQuestions.map((q, idx) => ({ q, idx }));
    if (!reviewOnlyMistakes) return withIdx;
    return withIdx.filter(({ q }) => selectedAnswers[q.id] !== q.correctIndex);
  }, [activeQuestions, reviewOnlyMistakes, selectedAnswers]);

  return (
    <section className="animate-view-in mx-auto max-w-4xl space-y-6 pb-12" data-session-seed={sessionSeed}>
      <header className="border-b border-[#E5DEC9] pb-6 dark:border-[#243047]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span>Перевірка знань формату НМТ · 30 тестових завдань</span>
          </div>
          {bestScore && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#57534E] dark:text-[#A8B2C5] tabular-nums">
              <Award className="h-3.5 w-3.5 text-[#059669] dark:text-[#34D399]" aria-hidden="true" />
              <span>
                Найкращий результат: <strong className="text-[#1C1917] dark:text-[#F4F1EA]">{bestScore.percentage}%</strong> ({bestScore.nmtScaledScore} балів)
              </span>
            </div>
          )}
        </div>

        <h1 className="mt-2 font-editorial text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-3xl lg:text-4xl">
          Тест-симулятор НМТ
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57534E] dark:text-[#A8B2C5] sm:text-base">
          Тренувальні завдання за зразком НМТ: дати, персоналії, цитати першоджерел і типові екзаменаційні пастки з миттєвим розбором кожної відповіді.
        </p>

        {/* Mode Selector */}
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#DDD4BE] bg-[#F7F4EC]/75 p-4 dark:border-[#243047] dark:bg-[#161D2B] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Режим тестування">
            <button
              type="button"
              onClick={() => startSession('blitz10')}
              aria-pressed={mode === 'blitz10'}
              className={`min-h-[40px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'blitz10'
                  ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-[#F59E0B] dark:bg-[#F59E0B] dark:text-[#0F141E]'
                  : 'border-[#DDD4BE] bg-white text-[#1C1917] hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#E2E8F0] dark:hover:bg-[#1D2638]'
              }`}
            >
              Бліц-тест (10 питань)
            </button>
            <button
              type="button"
              onClick={() => startSession('full30')}
              aria-pressed={mode === 'full30'}
              className={`min-h-[40px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'full30'
                  ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-[#F59E0B] dark:bg-[#F59E0B] dark:text-[#0F141E]'
                  : 'border-[#DDD4BE] bg-white text-[#1C1917] hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#E2E8F0] dark:hover:bg-[#1D2638]'
              }`}
            >
              Повний тест (30 питань)
            </button>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <label htmlFor="quiz-chapter-filter" className="text-xs font-semibold text-[#57534E] dark:text-[#A8B2C5] shrink-0">
              За розділом:
            </label>
            <select
              id="quiz-chapter-filter"
              value={mode === 'chapter' ? String(selectedChapterId) : ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 10) {
                  startSession('chapter', val);
                }
              }}
              className="h-10 w-full min-w-0 max-w-full truncate rounded-lg border border-[#DDD4BE] bg-white px-3 text-xs font-medium text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#F4F1EA] sm:max-w-[260px]"
            >
              <option value="" disabled>
                Обрати розділ (3 питання)
              </option>
              {chapters.map((ch) => (
                <option key={ch.id} value={String(ch.id)}>
                  Розділ {ch.id}: {ch.shortTitle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {isFinished ? (
        <div className="space-y-6 rounded-2xl border border-[#DDD4BE] bg-white p-6 shadow-[0_2px_16px_rgb(0,0,0,0.03)] sm:p-8 dark:border-[#243047] dark:bg-[#131A26]">
          <div className="flex flex-col gap-4 border-b border-[#EFEAE0] pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#243047]">
            <div>
              <div className="font-mono text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
                Підсумок тестування
              </div>
              <h2 className="mt-1 font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#F4F1EA] sm:text-3xl">
                {stats.percentage >= 80
                  ? 'Високий рівень готовності до НМТ!'
                  : stats.percentage >= 50
                    ? 'Добрий результат, варто закріпити деталі'
                    : 'Потрібно повторити теорію розділів'}
              </h2>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-[#E5DEC9] bg-[#FBF9F5] px-5 py-3.5 dark:border-[#243047] dark:bg-[#0F141E]">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#1E3A8A] dark:text-[#F59E0B]">
                  {stats.correctCount}/{stats.totalCount}
                </div>
                <div className="text-[11px] font-medium text-[#78716C] dark:text-[#94A3B8]">
                  Правильно ({stats.percentage}%)
                </div>
              </div>
              <div className="h-9 w-px bg-[#DDD4BE] dark:bg-[#243047]" aria-hidden="true" />
              <div className="text-center">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#059669] dark:text-[#34D399]">
                  {stats.nmtScaledScore}
                </div>
                <div className="text-[11px] font-medium text-[#78716C] dark:text-[#94A3B8]">
                  Шкала 100–200
                </div>
              </div>
            </div>
          </div>

          {stats.weakChapterIds.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                Розділи, у яких трапилися помилки (рекомендовано повторити):
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.weakChapterIds.map((chId) => (
                  <button
                    key={chId}
                    type="button"
                    onClick={() => onOpenChapter(chId)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D97706]/35 bg-[#FEF3C7]/45 px-3 py-1.5 text-xs font-semibold text-[#78350F] transition-colors hover:bg-[#FEF3C7] dark:border-[#F59E0B]/35 dark:bg-[#451A03]/30 dark:text-[#FDE68A] dark:hover:bg-[#451A03]/50"
                  >
                    <span>Розділ {chId}: {getChapterShortTitle(chId)}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review all answered questions with optional Mistakes-Only filter */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                Детальний розбір відповідей
              </h3>
              {mistakeCount > 0 && (
                <div
                  role="group"
                  aria-label="Фільтр розбору відповідей"
                  className="inline-flex rounded-lg border border-[#DDD4BE] bg-[#F3EFE6] p-1 dark:border-[#243047] dark:bg-[#161D2B]"
                >
                  <button
                    type="button"
                    onClick={() => setReviewOnlyMistakes(false)}
                    aria-pressed={!reviewOnlyMistakes}
                    className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      !reviewOnlyMistakes
                        ? 'bg-white text-[#1E3A8A] shadow-xs dark:bg-[#1D2638] dark:text-[#F59E0B]'
                        : 'text-[#57534E] hover:text-[#1C1917] dark:text-[#A8B2C5]'
                    }`}
                  >
                    Усі ({activeQuestions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewOnlyMistakes(true)}
                    aria-pressed={reviewOnlyMistakes}
                    className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      reviewOnlyMistakes
                        ? 'bg-white text-[#DC2626] shadow-xs dark:bg-[#1D2638] dark:text-[#F87171]'
                        : 'text-[#57534E] hover:text-[#1C1917] dark:text-[#A8B2C5]'
                    }`}
                  >
                    Лише помилки ({mistakeCount})
                  </button>
                </div>
              )}
            </div>

            <div className="divide-y divide-[#EFEAE0] rounded-xl border border-[#E5DEC9] dark:divide-[#243047] dark:border-[#243047]">
              {visibleReviewQuestions.map(({ q, idx }) => {
                const chosen = selectedAnswers[q.id];
                const isCorrect = chosen === q.correctIndex;
                return (
                  <div key={q.id} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#78716C] dark:text-[#94A3B8]">
                        Питання {idx + 1} · Розділ {q.chapterId}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#059669] dark:text-[#34D399]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Правильно</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#DC2626] dark:text-[#F87171]">
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Помилка</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                      {q.question}
                    </p>
                    <p className="text-xs leading-relaxed text-[#57534E] dark:text-[#A8B2C5]">
                      <strong className="text-[#059669] dark:text-[#34D399]">
                        Правильна відповідь ({OPTION_LETTERS[q.correctIndex]}):{' '}
                      </strong>
                      {q.options[q.correctIndex]}
                    </p>
                    <ReadableText
                      text={q.explanation}
                      sentenceThreshold={210}
                      maxChunkChars={180}
                      listLengthThreshold={110}
                      className="text-xs leading-relaxed text-[#57534E] dark:text-[#A8B2C5]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startSession(mode, selectedChapterId)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#172554] dark:bg-[#F59E0B] dark:text-[#0F141E] dark:hover:bg-[#D97706]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Пройти ще раз</span>
            </button>
            <button
              type="button"
              onClick={() => startSession('blitz10')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#DDD4BE] bg-white px-4 py-2.5 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638]"
            >
              <Shuffle className="h-4 w-4" aria-hidden="true" />
              <span>Новий випадковий бліц-тест</span>
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="space-y-5 rounded-2xl border border-[#DDD4BE] bg-white p-5 shadow-[0_2px_14px_rgb(0,0,0,0.03)] sm:p-8 dark:border-[#243047] dark:bg-[#131A26]">
          {/* Progress header */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C] dark:text-[#94A3B8]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-[#B45309] dark:text-[#F59E0B] tabular-nums">
                  Питання {currentIndex + 1} з {activeQuestions.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.kind}</span>
                <span aria-hidden="true">·</span>
                <span>Розділ {currentQuestion.chapterId}</span>
              </div>
              <span className="font-mono font-semibold tabular-nums text-[#059669] dark:text-[#34D399]">
                Правильно: {stats.correctCount}/{stats.answeredCount}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFEAE0] dark:bg-[#243047]">
              <div
                className="h-full rounded-full bg-[#1E3A8A] transition-all duration-300 dark:bg-[#F59E0B]"
                style={{
                  width: `${Math.round(((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / activeQuestions.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <h2 className="text-balance font-editorial text-xl font-bold leading-snug text-[#1C1917] dark:text-[#F4F1EA] sm:text-2xl">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-2.5" role="radiogroup" aria-label="Варіанти відповіді">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = currentSelected === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;

              let styleClass =
                'border-[#DDD4BE] bg-[#FBF9F5] text-[#1C1917] hover:border-[#1E3A8A]/50 hover:bg-white dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#E2E8F0] dark:hover:border-[#F59E0B]/50 dark:hover:bg-[#161D2B]';

              if (hasAnsweredCurrent) {
                if (isCorrectOption) {
                  styleClass =
                    'border-[#059669] bg-[#ECFDF5] text-[#064E3B] dark:border-[#10B981] dark:bg-[#064E3B]/40 dark:text-[#D1FAE5]';
                } else if (isSelected && !isCorrectOption) {
                  styleClass =
                    'border-[#DC2626] bg-[#FEF2F2] text-[#7F1D1D] dark:border-[#EF4444] dark:bg-[#7F1D1D]/30 dark:text-[#FECACA]';
                } else {
                  styleClass =
                    'border-[#EFEAE0] bg-[#FBF9F5]/60 text-[#78716C] opacity-75 dark:border-[#1E293B] dark:bg-[#0F141E]/50 dark:text-[#64748B]';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={hasAnsweredCurrent}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex min-h-[52px] w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#1E3A8A] disabled:cursor-default sm:text-[15px] ${styleClass}`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold ${
                      hasAnsweredCurrent && isCorrectOption
                        ? 'border-[#059669] bg-[#059669] text-white dark:border-[#10B981] dark:bg-[#10B981] dark:text-[#0F141E]'
                        : hasAnsweredCurrent && isSelected && !isCorrectOption
                          ? 'border-[#DC2626] bg-[#DC2626] text-white'
                          : 'border-[#DDD4BE] bg-white text-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F59E0B]'
                    }`}
                  >
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                  {hasAnsweredCurrent && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#059669] dark:text-[#34D399]" aria-label="Правильна відповідь" />
                  )}
                  {hasAnsweredCurrent && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 shrink-0 text-[#DC2626] dark:text-[#F87171]" aria-label="Помилковий вибір" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback & Next */}
          {hasAnsweredCurrent && (
            <div className="space-y-4 border-t border-[#EFEAE0] pt-5 dark:border-[#243047]">
              <div
                className={`rounded-xl border p-4 text-sm leading-relaxed ${
                  currentSelected === currentQuestion.correctIndex
                    ? 'border-[#059669]/30 bg-[#ECFDF5]/60 text-[#064E3B] dark:border-[#10B981]/30 dark:bg-[#064E3B]/25 dark:text-[#D1FAE5]'
                    : 'border-[#D97706]/35 bg-[#FEF3C7]/45 text-[#451A03] dark:border-[#F59E0B]/30 dark:bg-[#451A03]/25 dark:text-[#FDE68A]'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 font-semibold">
                  <span>
                    {currentSelected === currentQuestion.correctIndex
                      ? 'Правильно! Коментар НМТ:'
                      : `Помилка. Правильний варіант — ${OPTION_LETTERS[currentQuestion.correctIndex]}. Коментар НМТ:`}
                  </span>
                </div>
                <ReadableText
                  text={currentQuestion.explanation}
                  sentenceThreshold={210}
                  maxChunkChars={190}
                  listLengthThreshold={110}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChapter(currentQuestion.chapterId)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#DDD4BE] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#93C5FD] dark:hover:bg-[#1D2638]"
                >
                  <span>Перейти до Розділу {currentQuestion.chapterId}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#172554] dark:bg-[#F59E0B] dark:text-[#0F141E] dark:hover:bg-[#D97706] sm:w-auto"
                >
                  <span>
                    {currentIndex + 1 < activeQuestions.length
                      ? 'Наступне питання'
                      : 'Завершити і переглянути результат'}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <p className="hidden text-center text-[11px] text-[#78716C] dark:text-[#8B97AD] sm:block">
            Підказка: клавіші 1–4 обирають варіант відповіді, Enter або → переходять до наступного питання.
          </p>
        </div>
      ) : null}
    </section>
  );
};
