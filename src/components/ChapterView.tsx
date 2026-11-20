import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Compass,
  ImageOff,
  KeyRound,
  Quote,
  RefreshCw,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import { Chapter, ContentBlock, VisualInsertItem } from '../types/portal';
import { estimateReadingMinutes, parseStructuredListItem } from '../utils/portalLogic';
import { FlashcardDeck } from './FlashcardDeck';
import { ReadableText } from './ReadableText';
import { RichText } from './RichText';

interface ChapterViewProps {
  chapter: Chapter;
  totalChapters: number;
  isCompleted: boolean;
  onToggleComplete: (chapterId: number) => void;
  onNavigateChapter: (chapterId: number) => void;
  onStartChapterQuiz?: (chapterId: number) => void;
  prevChapterTitle?: string;
  nextChapterTitle?: string;
  requestedRefTab?: { chapterId: number; tab: 'dates' | 'terms' | 'figures'; seq: number } | null;
  memorizedCardIds: string[];
  onToggleMemorizedCard: (cardId: string) => void;
  onReadProgressChange?: (progress: number) => void;
}

export const ChapterView: React.FC<ChapterViewProps> = ({
  chapter,
  totalChapters,
  isCompleted,
  onToggleComplete,
  onNavigateChapter,
  onStartChapterQuiz,
  prevChapterTitle,
  nextChapterTitle,
  requestedRefTab,
  memorizedCardIds,
  onToggleMemorizedCard,
  onReadProgressChange,
}) => {
  const [referenceTab, setReferenceTab] = useState<'dates' | 'terms' | 'figures'>('dates');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});

  const readingMinutes = useMemo(() => estimateReadingMinutes(chapter), [chapter]);

  // Collect all inline visual items in reading order for seamless Prev/Next Lightbox browsing
  const allVisualItems = useMemo<VisualInsertItem[]>(() => {
    const items: VisualInsertItem[] = [];
    for (const sec of chapter.sections) {
      for (const block of sec.blocks) {
        if (block.type === 'figure') {
          items.push(block);
        } else if (block.type === 'gallery') {
          items.push(...block.items);
        }
      }
    }
    return items;
  }, [chapter]);

  const openLightboxForSrc = useCallback(
    (src: string, fallbackItem: VisualInsertItem) => {
      const idx = allVisualItems.findIndex((it) => it.src === src);
      if (idx !== -1) {
        setLightboxIndex(idx);
      } else if (allVisualItems.length > 0) {
        setLightboxIndex(0);
      } else {
        setLightboxIndex(null);
        void fallbackItem;
      }
    },
    [allVisualItems],
  );

  // Reading depth indicator synced to Header
  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        onReadProgressChange?.(0);
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100)));
      onReadProgressChange?.(pct);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [chapter.id, onReadProgressChange]);

  // Reset lightbox when changing chapter
  useEffect(() => {
    setLightboxIndex(null);
  }, [chapter.id]);

  // Switch reference tab automatically when jumped via global search
  useEffect(() => {
    if (requestedRefTab && requestedRefTab.chapterId === chapter.id) {
      setReferenceTab(requestedRefTab.tab);
    }
  }, [requestedRefTab, chapter.id]);

  // Keyboard navigation & body scroll lock in Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && allVisualItems.length > 1) {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % allVisualItems.length));
      } else if (e.key === 'ArrowLeft' && allVisualItems.length > 1) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + allVisualItems.length) % allVisualItems.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, allVisualItems.length]);

  const markImageFailed = (src: string) => {
    setFailedUrls((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  };

  const handleRetryImage = (src: string) => {
    setFailedUrls((prev) => ({ ...prev, [src]: false }));
    setRetryCounts((prev) => ({ ...prev, [src]: (prev[src] ?? 0) + 1 }));
  };

  const getDisplaySrc = (src: string) => {
    const count = retryCounts[src] ?? 0;
    if (count === 0) return src;
    return src.includes('?') ? `${src}&retry=${count}` : `${src}?retry=${count}`;
  };

  const lightboxItem = lightboxIndex !== null ? allVisualItems[lightboxIndex] ?? null : null;

  const renderBlock = (block: ContentBlock, idx: number, isFirstParagraphInSection: boolean) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <ReadableText
            key={idx}
            text={block.text}
            sentenceThreshold={340}
            maxChunkChars={260}
            listLengthThreshold={160}
            paragraphSpacing="space-y-3"
            className={
              isFirstParagraphInSection
                ? 'max-w-[74ch] text-[16px] leading-[1.82] text-[#1C1917] dark:text-[#F1F5F9] sm:text-[17px]'
                : 'max-w-[74ch] text-[15px] leading-[1.78] text-[#292524] dark:text-[#CBD5E1] sm:text-base'
            }
          />
        );
      case 'subheading':
        return (
          <div key={idx} className="pt-4">
            <div className="flex items-center gap-3 pb-1.5">
              <h3 className="font-editorial text-lg font-bold tracking-tight text-[#1E3A8A] dark:text-[#93C5FD] sm:text-xl">
                {block.text}
              </h3>
              <div className="h-px flex-1 bg-[#E5DEC9] dark:bg-[#243047]" aria-hidden="true" />
            </div>
          </div>
        );
      case 'list': {
        if (block.ordered) {
          return (
            <ol key={idx} className="space-y-2.5">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-3.5 rounded-xl border border-[#E5DEC9] bg-white px-4 py-3.5 shadow-[0_1px_4px_rgb(0,0,0,0.02)] dark:border-[#243047] dark:bg-[#161D2B]"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F3EFE6] font-mono text-xs font-bold tabular-nums text-[#1E3A8A] dark:bg-[#1D2638] dark:text-[#F59E0B]">
                    {String(itemIdx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1 text-[15px] leading-[1.7] text-[#292524] dark:text-[#CBD5E1] sm:text-base">
                    <ReadableText
                      text={item}
                      sentenceThreshold={280}
                      maxChunkChars={220}
                      listLengthThreshold={140}
                    />
                  </div>
                </li>
              ))}
            </ol>
          );
        }

        const parsedItems = block.items.map((item) => parseStructuredListItem(item));
        const allStructured = parsedItems.every((parsed) => parsed !== null);

        if (allStructured && block.items.length >= 2) {
          const maxBodyLength = Math.max(
            ...parsedItems.map((p) => (p ? p.body.length : 0)),
          );
          const useTwoColumns =
            maxBodyLength <= 260 &&
            block.items.length >= 2 &&
            block.items.length % 2 === 0;

          if (useTwoColumns) {
            return (
              <div key={idx} className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {parsedItems.map((parsed, itemIdx) => {
                  if (!parsed) return null;
                  return (
                    <div
                      key={itemIdx}
                      className="rounded-xl border border-[#E5DEC9] bg-white p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-colors hover:border-[#1E3A8A]/35 sm:p-5 dark:border-[#243047] dark:bg-[#161D2B] dark:hover:border-[#F59E0B]/35"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[#EFEAE0] pb-2.5 dark:border-[#243047]">
                        <div className="text-[15px] font-bold leading-snug text-[#1E3A8A] dark:text-[#93C5FD] sm:text-base">
                          <RichText
                            text={parsed.heading}
                            boldClassName="font-bold text-[#1E3A8A] dark:text-[#93C5FD]"
                          />
                        </div>
                        <span className="mt-0.5 shrink-0 font-mono text-[11px] font-semibold tabular-nums text-[#B45309] dark:text-[#F59E0B]">
                          {String(itemIdx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <ReadableText
                        text={parsed.body}
                        sentenceThreshold={250}
                        maxChunkChars={210}
                        listLengthThreshold={130}
                        className="mt-2.5 text-[14.5px] leading-[1.7] text-[#292524] dark:text-[#CBD5E1] sm:text-[15px]"
                      />
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="divide-y divide-[#EFEAE0] overflow-hidden rounded-2xl border border-[#DDD4BE] bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:divide-[#243047] dark:border-[#243047] dark:bg-[#161D2B]"
            >
              {parsedItems.map((parsed, itemIdx) => {
                if (!parsed) return null;
                return (
                  <div
                    key={itemIdx}
                    className="grid grid-cols-1 gap-2 p-4 transition-colors hover:bg-[#FBF9F5] sm:grid-cols-[34px_230px_1fr] sm:items-baseline sm:gap-4 sm:px-5 sm:py-4 dark:hover:bg-[#1A2334]"
                  >
                    <span className="hidden font-mono text-xs font-semibold tabular-nums text-[#B45309] dark:text-[#F59E0B] sm:inline">
                      {String(itemIdx + 1).padStart(2, '0')}
                    </span>
                    <div className="text-[15px] font-bold leading-snug text-[#1E3A8A] dark:text-[#93C5FD]">
                      <span className="mr-2 font-mono text-xs font-semibold tabular-nums text-[#B45309] dark:text-[#F59E0B] sm:hidden">
                        {String(itemIdx + 1).padStart(2, '0')}.
                      </span>
                      <RichText
                        text={parsed.heading}
                        boldClassName="font-bold text-[#1E3A8A] dark:text-[#93C5FD]"
                      />
                    </div>
                    <ReadableText
                      text={parsed.body}
                      sentenceThreshold={270}
                      maxChunkChars={220}
                      listLengthThreshold={135}
                      className="text-[14.5px] leading-[1.7] text-[#292524] dark:text-[#CBD5E1] sm:text-[15px]"
                    />
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="rounded-xl border border-[#E5DEC9] bg-[#F7F4EC]/70 p-4 sm:p-5 dark:border-[#243047] dark:bg-[#131A26]"
          >
            <ul className="space-y-3">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-3 text-[15px] leading-[1.7] text-[#292524] dark:text-[#CBD5E1] sm:text-base"
                >
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#B45309] dark:bg-[#F59E0B]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <ReadableText
                      text={item}
                      sentenceThreshold={270}
                      maxChunkChars={220}
                      listLengthThreshold={135}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      case 'trap':
        return (
          <div
            key={idx}
            className="rounded-xl border border-[#D97706]/35 bg-[#FEF3C7]/45 p-4 sm:p-5 dark:border-[#F59E0B]/30 dark:bg-[#78350F]/20"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#92400E] dark:text-[#FBBF24]">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{block.label}</span>
            </div>
            <ReadableText
              text={block.text}
              sentenceThreshold={270}
              maxChunkChars={220}
              listLengthThreshold={135}
              boldClassName="font-semibold text-[#78350F] dark:text-[#FEF3C7]"
              prefixClassName="font-semibold text-[#78350F] dark:text-[#FEF3C7]"
              leadClassName="font-medium text-[#451A03] dark:text-[#FDE68A]"
              bulletClassName="bg-[#B45309] dark:bg-[#FBBF24]"
              className="mt-2 text-[15px] leading-relaxed text-[#451A03] dark:text-[#FDE68A]"
            />
          </div>
        );
      case 'flow':
        return (
          <div
            key={idx}
            className="rounded-xl border border-[#DDD4BE] bg-[#F7F4EC] p-4 sm:p-5 dark:border-[#243047] dark:bg-[#161D2B]"
          >
            {block.label && (
              <p className="mb-3 text-xs font-semibold tracking-wide text-[#57534E] dark:text-[#A8B2C5]">
                {block.label}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-[#1E3A8A] dark:text-[#93C5FD]">
              {block.steps.map((step, stepIdx) => (
                <React.Fragment key={stepIdx}>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#DDD4BE] bg-white px-3 py-2 shadow-[0_1px_3px_rgb(0,0,0,0.02)] dark:border-[#2A354D] dark:bg-[#0F141E]">
                    <span className="font-mono text-[11px] font-bold tabular-nums text-[#B45309] dark:text-[#F59E0B]">
                      {String(stepIdx + 1).padStart(2, '0')}
                    </span>
                    <span>{step}</span>
                  </span>
                  {stepIdx < block.steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#B45309] dark:text-[#F59E0B]" aria-hidden="true" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      case 'table':
        return (
          <div key={idx} className="space-y-2.5">
            {block.caption && (
              <p className="text-xs font-semibold tracking-wide text-[#57534E] dark:text-[#94A3B8]">
                {block.caption}
              </p>
            )}
            <div className="overflow-x-auto rounded-2xl border border-[#DDD4BE] bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:border-[#243047] dark:bg-[#161D2B]">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5DEC9] bg-[#F3EFE6] dark:border-[#243047] dark:bg-[#1D2638]">
                    {block.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        scope="col"
                        className="px-4 py-3.5 font-semibold text-[#1C1917] dark:text-[#F4F1EA]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE0] dark:divide-[#243047]">
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="transition-colors hover:bg-[#FBF9F5] dark:hover:bg-[#1A2334]"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-3.5 align-top leading-relaxed ${
                            cIdx === 0
                              ? 'font-semibold text-[#1E3A8A] dark:text-[#93C5FD]'
                              : 'text-[#292524] dark:text-[#CBD5E1]'
                          }`}
                        >
                          <ReadableText
                            text={cell}
                            sentenceThreshold={195}
                            listLengthThreshold={110}
                            preferListForLongText={true}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'figure': {
        const isBroken = Boolean(failedUrls[block.src]);
        return (
          <figure
            key={idx}
            className="my-3 overflow-hidden rounded-2xl border border-[#DDD4BE] bg-white p-4 shadow-[0_2px_12px_rgb(0,0,0,0.03)] sm:p-5 dark:border-[#243047] dark:bg-[#161D2B]"
          >
            {block.title && (
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#F4F1EA] sm:text-lg">
                  {block.title}
                </span>
                {block.badge && (
                  <span className="font-mono text-[11px] font-semibold text-[#B45309] dark:text-[#F59E0B]">
                    {block.badge}
                  </span>
                )}
              </div>
            )}

            {isBroken ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-[#E5DEC9] bg-[#F4EFE4] px-4 text-center text-xs text-[#78716C] dark:border-[#243047] dark:bg-[#0B0F17] dark:text-[#94A3B8]">
                <ImageOff className="h-5 w-5" aria-hidden="true" />
                <span>Не вдалося завантажити ілюстрацію з архіву</span>
                <button
                  type="button"
                  onClick={() => handleRetryImage(block.src)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#DDD4BE] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F59E0B] dark:hover:bg-[#1D2638]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Повторити завантаження</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openLightboxForSrc(block.src, block)}
                aria-label={`Збільшити зображення: ${block.alt}`}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5DEC9] bg-[#F4EFE4] p-2.5 transition-colors hover:border-[#1E3A8A]/45 focus-visible:outline-2 focus-visible:outline-[#1E3A8A] dark:border-[#243047] dark:bg-[#0B0F17] dark:hover:border-[#F59E0B]/45"
              >
                <img
                  key={`${block.src}-${retryCounts[block.src] ?? 0}`}
                  src={getDisplaySrc(block.src)}
                  alt={block.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed(block.src)}
                  className="max-h-[400px] w-auto max-w-full rounded-lg object-contain transition-transform duration-300 group-hover:scale-[1.015]"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-3 bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDD4BE] bg-white/95 text-[#1C1917] opacity-80 shadow-xs transition-opacity group-hover:opacity-100 dark:border-[#2A354D] dark:bg-[#161D2B]/95 dark:text-[#F4F1EA]"
                >
                  <ZoomIn className="h-4 w-4" />
                </span>
              </button>
            )}

            <figcaption className="mt-3 border-t border-[#EFEAE0] pt-2.5 text-xs leading-relaxed text-[#57534E] dark:border-[#243047] dark:text-[#A8B2C5] sm:text-[13px]">
              <RichText text={block.caption} />
            </figcaption>
          </figure>
        );
      }
      case 'gallery': {
        const colsClass =
          block.columns === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        return (
          <div key={idx} className="my-3 space-y-3">
            {block.title && (
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold tracking-wide text-[#B45309] dark:text-[#F59E0B]">
                  {block.title}
                </p>
                <div className="h-px flex-1 bg-[#E5DEC9] dark:bg-[#243047]" aria-hidden="true" />
              </div>
            )}
            <div className={`grid gap-4 ${colsClass}`}>
              {block.items.map((item, itemIdx) => {
                const isBroken = Boolean(failedUrls[item.src]);
                return (
                  <figure
                    key={itemIdx}
                    className="flex flex-col overflow-hidden rounded-xl border border-[#DDD4BE] bg-white p-3 shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-colors hover:border-[#1E3A8A]/40 dark:border-[#243047] dark:bg-[#161D2B] dark:hover:border-[#F59E0B]/40"
                  >
                    {isBroken ? (
                      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-[#EFEAE0] bg-[#F4EFE4] px-3 text-center text-xs text-[#78716C] dark:border-[#243047] dark:bg-[#0B0F17] dark:text-[#94A3B8]">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                        <span>Зображення недоступне</span>
                        <button
                          type="button"
                          onClick={() => handleRetryImage(item.src)}
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-[#DDD4BE] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A] hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F59E0B]"
                        >
                          <RefreshCw className="h-3 w-3" aria-hidden="true" />
                          <span>Повторити</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openLightboxForSrc(item.src, item)}
                        aria-label={`Збільшити зображення: ${item.title || item.alt}`}
                        className="group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-lg border border-[#EFEAE0] bg-[#F4EFE4] p-2 focus-visible:outline-2 focus-visible:outline-[#1E3A8A] dark:border-[#243047] dark:bg-[#0B0F17]"
                      >
                        <img
                          key={`${item.src}-${retryCounts[item.src] ?? 0}`}
                          src={getDisplaySrc(item.src)}
                          alt={item.alt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed(item.src)}
                          className="h-full w-full rounded object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute right-2 bottom-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#DDD4BE] bg-white/95 text-[#1C1917] opacity-80 shadow-xs transition-opacity group-hover:opacity-100 dark:border-[#2A354D] dark:bg-[#161D2B]/95 dark:text-[#F4F1EA]"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    )}

                    <figcaption className="mt-3 flex-1 space-y-1.5 border-t border-[#EFEAE0] pt-2.5 dark:border-[#243047]">
                      <div className="flex items-start justify-between gap-2">
                        {item.title && (
                          <div className="font-editorial text-sm font-bold leading-snug text-[#1C1917] dark:text-[#F4F1EA]">
                            {item.title}
                          </div>
                        )}
                        {item.badge && (
                          <span className="shrink-0 font-mono text-[10px] font-semibold text-[#B45309] dark:text-[#F59E0B]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-[#57534E] dark:text-[#A8B2C5]">
                        <RichText text={item.caption} />
                      </p>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <article className="animate-view-in mx-auto max-w-4xl space-y-11 pb-12">
      {/* Editorial Broadsheet Chapter Header */}
      <header className="rounded-2xl border border-[#DDD4BE] bg-white p-5 shadow-[0_2px_14px_rgb(0,0,0,0.03)] sm:p-8 dark:border-[#243047] dark:bg-[#131A26]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#78716C] dark:text-[#94A3B8]">
          <span className="font-mono font-semibold text-[#B45309] dark:text-[#F59E0B]">
            Розділ {chapter.id} з {totalChapters}
          </span>
          <span aria-hidden="true">·</span>
          <span>{chapter.period}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>~{readingMinutes} хв читання</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{chapter.flashcards.length} флеш-карток</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{allVisualItems.length} ілюстрацій</span>
        </div>

        <h1 className="mt-3 text-balance font-editorial text-2xl font-bold leading-[1.18] tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-3xl lg:text-[34px]">
          {chapter.title}
        </h1>

        <p className="mt-4 max-w-[74ch] text-[15px] leading-[1.75] text-[#57534E] dark:text-[#A8B2C5] sm:text-base">
          {chapter.summary}
        </p>

        {/* Chapter Subsection Quick Navigation */}
        <div className="mt-6 border-t border-[#EFEAE0] pt-5 dark:border-[#243047]">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#78716C] dark:text-[#94A3B8]">
            <Compass className="h-3.5 w-3.5 text-[#B45309] dark:text-[#F59E0B]" aria-hidden="true" />
            <span>Структура розділу</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {chapter.sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="group flex items-baseline gap-2.5 rounded-lg border border-[#EFEAE0] bg-[#FBF9F5] px-3.5 py-2.5 text-sm transition-colors hover:border-[#1E3A8A]/40 hover:bg-white dark:border-[#243047] dark:bg-[#0F141E] dark:hover:border-[#F59E0B]/40 dark:hover:bg-[#161D2B]"
              >
                <span className="font-mono text-xs font-semibold tabular-nums text-[#B45309] dark:text-[#F59E0B]">
                  {sec.number.padStart(2, '0')}
                </span>
                <span className="font-medium leading-snug text-[#292524] group-hover:text-[#1E3A8A] dark:text-[#CBD5E1] dark:group-hover:text-[#F4F1EA]">
                  {sec.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Utility Anchors & Completion / Chapter Quiz CTAs */}
        <div className="mt-5 flex flex-col gap-3 border-t border-[#EFEAE0] pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-[#243047]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[#57534E] dark:text-[#A8B2C5]">
            <a
              href={`#ch-${chapter.id}-traps`}
              className="hover:text-[#1E3A8A] hover:underline dark:hover:text-[#F59E0B] whitespace-nowrap"
            >
              Пастки НМТ
            </a>
            <a
              href={`#ch-${chapter.id}-quotes`}
              className="hover:text-[#1E3A8A] hover:underline dark:hover:text-[#F59E0B] whitespace-nowrap"
            >
              Першоджерела ({chapter.quotes.length})
            </a>
            <a
              href={`#ch-${chapter.id}-reference`}
              className="hover:text-[#1E3A8A] hover:underline dark:hover:text-[#F59E0B] whitespace-nowrap"
            >
              Дати, терміни, персоналії
            </a>
            <a
              href={`#ch-${chapter.id}-flashcards`}
              className="hover:text-[#1E3A8A] hover:underline dark:hover:text-[#F59E0B] whitespace-nowrap"
            >
              Флеш-картки ({chapter.flashcards.length})
            </a>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onStartChapterQuiz && (
              <button
                type="button"
                onClick={() => onStartChapterQuiz(chapter.id)}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#DDD4BE] bg-[#FBF9F5] px-3.5 py-2 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#EFEAE0] focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:w-auto dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#F59E0B] dark:hover:bg-[#1D2638] whitespace-nowrap"
              >
                <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Тест з розділу (3 питання)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleComplete(chapter.id)}
              aria-pressed={isCompleted}
              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:w-auto whitespace-nowrap ${
                isCompleted
                  ? 'border border-[#059669]/40 bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5] dark:border-[#10B981]/40 dark:bg-[#064E3B]/50 dark:text-[#34D399]'
                  : 'bg-[#1E3A8A] text-white hover:bg-[#172554] dark:bg-[#F59E0B] dark:text-[#0F141E] dark:hover:bg-[#D97706]'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{isCompleted ? 'Розділ вивчено' : 'Позначити як вивчений'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Theoretical Sections */}
      <div className="space-y-12">
        {chapter.sections.map((section) => {
          let seenParagraph = false;
          return (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="scroll-mt-24 space-y-5 border-t border-[#E5DEC9] pt-8 first:border-t-0 first:pt-0 dark:border-[#243047]"
            >
              <div className="space-y-1">
                <div className="font-mono text-xs font-semibold tabular-nums text-[#B45309] dark:text-[#F59E0B]">
                  Розділ {chapter.id} · Підрозділ {section.number.padStart(2, '0')}
                </div>
                <h2
                  id={section.id}
                  className="text-balance font-editorial text-xl font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-2xl"
                >
                  {section.title}
                </h2>
              </div>

              <div className="space-y-5">
                {section.blocks.map((block, idx) => {
                  const isFirstLead = block.type === 'paragraph' && !seenParagraph;
                  if (block.type === 'paragraph') {
                    seenParagraph = true;
                  }
                  return renderBlock(block, idx, isFirstLead);
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Dedicated NMT Trap Block */}
      <section
        id={`ch-${chapter.id}-traps`}
        aria-labelledby={`ch-${chapter.id}-traps-title`}
        className="scroll-mt-24 rounded-2xl border border-[#D97706]/40 bg-[#FEF3C7]/45 p-5 sm:p-7 dark:border-[#F59E0B]/35 dark:bg-[#451A03]/25"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#B45309] dark:text-[#FBBF24]" aria-hidden="true" />
          <h2
            id={`ch-${chapter.id}-traps-title`}
            className="font-editorial text-xl font-bold text-[#78350F] dark:text-[#FDE68A] sm:text-2xl"
          >
            Пастка НМТ: {chapter.trapSummary.title}
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {chapter.trapSummary.items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#D97706]/25 bg-white/80 p-4 dark:border-[#F59E0B]/20 dark:bg-[#161D2B]/80"
            >
              <div className="flex items-baseline gap-2 text-sm font-bold text-[#78350F] dark:text-[#FEF3C7]">
                <span className="font-mono text-xs tabular-nums text-[#B45309] dark:text-[#FBBF24]">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span>{item.trap}</span>
              </div>
              <ReadableText
                text={item.explanation}
                sentenceThreshold={240}
                maxChunkChars={200}
                listLengthThreshold={120}
                boldClassName="font-semibold text-[#78350F] dark:text-white"
                prefixClassName="font-semibold text-[#78350F] dark:text-white"
                leadClassName="font-medium text-[#451A03] dark:text-[#FDE68A]"
                bulletClassName="bg-[#B45309] dark:bg-[#FBBF24]"
                className="mt-1.5 text-sm leading-relaxed text-[#451A03] dark:text-[#FDE68A]/90"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Primary Historical Sources Block */}
      <section
        id={`ch-${chapter.id}-quotes`}
        aria-labelledby={`ch-${chapter.id}-quotes-title`}
        className="scroll-mt-24 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <Quote className="h-5 w-5 shrink-0 text-[#1E3A8A] dark:text-[#60A5FA]" aria-hidden="true" />
          <h2
            id={`ch-${chapter.id}-quotes-title`}
            className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#F4F1EA] sm:text-2xl"
          >
            Хрестоматійний блок: Історичні джерела та цитати
          </h2>
        </div>

        <div className="space-y-4">
          {chapter.quotes.map((quote, idx) => (
            <figure
              key={quote.id}
              className="rounded-2xl border border-[#DDD4BE] bg-white p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] sm:p-6 dark:border-[#243047] dark:bg-[#161D2B]"
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-xs font-medium text-[#78716C] dark:text-[#94A3B8]">
                <span className="font-mono font-semibold text-[#B45309] dark:text-[#F59E0B]">
                  Джерело {String(idx + 1).padStart(2, '0')}
                </span>
                <span>Першоджерело НМТ</span>
              </div>
              <blockquote className="font-editorial text-base italic leading-relaxed text-[#1C1917] dark:text-[#F4F1EA] sm:text-lg">
                <RichText
                  text={quote.text}
                  boldClassName="not-italic font-bold text-[#1E3A8A] dark:text-[#FBBF24]"
                />
              </blockquote>
              <figcaption className="mt-4 space-y-1.5 border-t border-[#EFEAE0] pt-3 text-sm dark:border-[#243047]">
                <div className="font-semibold text-[#292524] dark:text-[#E2E8F0]">
                  Атрибуція: {quote.attribution}
                </div>
                <div className="text-xs leading-relaxed text-[#57534E] dark:text-[#A8B2C5]">
                  <span className="font-semibold text-[#B45309] dark:text-[#F59E0B]">Маркер НМТ: </span>
                  <RichText text={quote.marker} />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Key Dates, Terms & Figures of the Chapter */}
      <section
        id={`ch-${chapter.id}-reference`}
        aria-labelledby={`ch-${chapter.id}-ref-title`}
        className="scroll-mt-24 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BookMarked className="h-5 w-5 shrink-0 text-[#1E3A8A] dark:text-[#60A5FA]" aria-hidden="true" />
            <h2
              id={`ch-${chapter.id}-ref-title`}
              className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#F4F1EA] sm:text-2xl"
            >
              Ключові дати, терміни та персоналії розділу
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Фільтр довідника розділу"
            className="flex overflow-x-auto no-scrollbar rounded-lg border border-[#DDD4BE] bg-[#F3EFE6] p-1 dark:border-[#243047] dark:bg-[#161D2B]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={referenceTab === 'dates'}
              onClick={() => setReferenceTab('dates')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                referenceTab === 'dates'
                  ? 'bg-white text-[#1E3A8A] shadow-xs dark:bg-[#1D2638] dark:text-[#F59E0B]'
                  : 'text-[#57534E] hover:text-[#1C1917] dark:text-[#A8B2C5] dark:hover:text-[#F4F1EA]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Дати ({chapter.dates.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={referenceTab === 'terms'}
              onClick={() => setReferenceTab('terms')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                referenceTab === 'terms'
                  ? 'bg-white text-[#1E3A8A] shadow-xs dark:bg-[#1D2638] dark:text-[#F59E0B]'
                  : 'text-[#57534E] hover:text-[#1C1917] dark:text-[#A8B2C5] dark:hover:text-[#F4F1EA]'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Терміни ({chapter.terms.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={referenceTab === 'figures'}
              onClick={() => setReferenceTab('figures')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                referenceTab === 'figures'
                  ? 'bg-white text-[#1E3A8A] shadow-xs dark:bg-[#1D2638] dark:text-[#F59E0B]'
                  : 'text-[#57534E] hover:text-[#1C1917] dark:text-[#A8B2C5] dark:hover:text-[#F4F1EA]'
              }`}
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Персоналії ({chapter.figures.length})</span>
            </button>
          </div>
        </div>

        {referenceTab === 'dates' && (
          <div className="divide-y divide-[#EFEAE0] rounded-2xl border border-[#DDD4BE] bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:divide-[#243047] dark:border-[#243047] dark:bg-[#161D2B]">
            {chapter.dates.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-1.5 p-4 sm:grid-cols-[200px_1fr] sm:gap-4">
                <div className="font-mono text-sm font-semibold tabular-nums text-[#1E3A8A] dark:text-[#F59E0B]">
                  {item.date}
                </div>
                <div className="text-sm leading-relaxed text-[#292524] dark:text-[#CBD5E1]">
                  <ReadableText
                    text={item.description}
                    sentenceThreshold={200}
                    listLengthThreshold={110}
                    preferListForLongText={true}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {referenceTab === 'terms' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {chapter.terms.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#DDD4BE] bg-white p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] sm:p-5 dark:border-[#243047] dark:bg-[#161D2B]"
              >
                <div className="text-base font-bold text-[#1E3A8A] dark:text-[#93C5FD]">
                  {item.term}
                </div>
                <ReadableText
                  text={item.definition}
                  sentenceThreshold={210}
                  maxChunkChars={190}
                  listLengthThreshold={115}
                  className="mt-1.5 text-sm leading-relaxed text-[#292524] dark:text-[#CBD5E1]"
                />
              </div>
            ))}
          </div>
        )}

        {referenceTab === 'figures' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {chapter.figures.map((fig, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#DDD4BE] bg-white p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] sm:p-5 dark:border-[#243047] dark:bg-[#161D2B]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#F4F1EA]">
                    {fig.name}
                  </div>
                  {fig.years && (
                    <span className="font-mono text-xs tabular-nums text-[#78716C] dark:text-[#94A3B8]">
                      {fig.years}
                    </span>
                  )}
                </div>
                <ReadableText
                  text={fig.description}
                  sentenceThreshold={200}
                  listLengthThreshold={110}
                  preferListForLongText={true}
                  className="mt-2 text-sm leading-relaxed text-[#292524] dark:text-[#CBD5E1]"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive 10 Flashcards Section */}
      <section
        id={`ch-${chapter.id}-flashcards`}
        aria-labelledby={`ch-${chapter.id}-fc-title`}
        className="scroll-mt-24 rounded-2xl border border-[#DDD4BE] bg-[#F7F4EC]/75 p-5 sm:p-7 dark:border-[#243047] dark:bg-[#111722]"
      >
        <h2
          id={`ch-${chapter.id}-fc-title`}
          className="mb-4 font-editorial text-xl font-bold text-[#1C1917] dark:text-[#F4F1EA] sm:text-2xl"
        >
          Флеш-картки розділу ({chapter.flashcards.length} шт.)
        </h2>

        <FlashcardDeck
          cards={chapter.flashcards}
          memorizedIds={memorizedCardIds}
          onToggleMemorized={onToggleMemorizedCard}
        />
      </section>

      {/* Bottom Chapter Navigation & Completion */}
      <footer className="space-y-4 border-t border-[#E5DEC9] pt-6 dark:border-[#243047]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {chapter.id > 1 ? (
            <button
              type="button"
              onClick={() => onNavigateChapter(chapter.id - 1)}
              className="group flex min-h-[56px] items-center gap-3 rounded-xl border border-[#DDD4BE] bg-white px-4 py-3 text-left transition-colors hover:border-[#1E3A8A]/40 hover:bg-[#FBF9F5] dark:border-[#2A354D] dark:bg-[#161D2B] dark:hover:border-[#F59E0B]/40 dark:hover:bg-[#1D2638]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-[#78716C] transition-transform group-hover:-translate-x-0.5 dark:text-[#94A3B8]" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-semibold text-[#78716C] dark:text-[#94A3B8]">
                  Попередній · Розділ {chapter.id - 1}
                </div>
                {prevChapterTitle && (
                  <div className="truncate text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                    {prevChapterTitle}
                  </div>
                )}
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {chapter.id < totalChapters && (
            <button
              type="button"
              onClick={() => onNavigateChapter(chapter.id + 1)}
              className="group flex min-h-[56px] items-center justify-between gap-3 rounded-xl bg-[#1E3A8A] px-4 py-3 text-left text-white transition-colors hover:bg-[#172554] dark:bg-[#F59E0B] dark:text-[#0F141E] dark:hover:bg-[#D97706]"
            >
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-semibold text-white/80 dark:text-[#0F141E]/80">
                  Далі · Розділ {chapter.id + 1}
                </div>
                {nextChapterTitle && (
                  <div className="truncate text-sm font-semibold">
                    {nextChapterTitle}
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {onStartChapterQuiz && (
            <button
              type="button"
              onClick={() => onStartChapterQuiz(chapter.id)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#DDD4BE] bg-white px-4 py-2 text-sm font-medium text-[#1E3A8A] transition-colors hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F59E0B] dark:hover:bg-[#1D2638] whitespace-nowrap"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              <span>Пройти тест за розділом</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleComplete(chapter.id)}
            aria-pressed={isCompleted}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isCompleted
                ? 'border-[#059669]/40 bg-[#ECFDF5] text-[#047857] dark:border-[#10B981]/40 dark:bg-[#064E3B]/50 dark:text-[#34D399]'
                : 'border-[#DDD4BE] bg-white text-[#1C1917] hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638]'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>{isCompleted ? 'Вивчено' : 'Позначити «Вивчено»'}</span>
          </button>
        </div>
      </footer>

      {/* Image Lightbox Modal with Prev/Next Navigation */}
      {lightboxItem && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title || lightboxItem.alt}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-xs sm:items-center sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[#DDD4BE] bg-[#FBF9F5] shadow-2xl sm:rounded-2xl dark:border-[#2A354D] dark:bg-[#111722]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E5DEC9] px-4 py-3 sm:px-6 dark:border-[#243047]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[#B45309] dark:text-[#F59E0B]">
                  {lightboxItem.badge && <span>{lightboxItem.badge}</span>}
                  {lightboxItem.badge && allVisualItems.length > 1 && <span aria-hidden="true">·</span>}
                  {allVisualItems.length > 1 && (
                    <span className="tabular-nums text-[#78716C] dark:text-[#94A3B8]">
                      Ілюстрація {lightboxIndex + 1} з {allVisualItems.length}
                    </span>
                  )}
                </div>
                <h3 className="truncate font-editorial text-base font-bold text-[#1C1917] dark:text-[#F4F1EA] sm:text-lg">
                  {lightboxItem.title || lightboxItem.alt}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {allVisualItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex - 1 + allVisualItems.length) % allVisualItems.length,
                        )
                      }
                      aria-label="Попередня ілюстрація"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DDD4BE] bg-white text-[#1C1917] transition-colors hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((lightboxIndex + 1) % allVisualItems.length)
                      }
                      aria-label="Наступна ілюстрація"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DDD4BE] bg-white text-[#1C1917] transition-colors hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Закрити перегляд зображення"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DDD4BE] bg-white text-[#1C1917] transition-colors hover:bg-[#F3EFE6] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-[#F3EFE6]/70 p-4 dark:bg-[#0B0F17]">
              {failedUrls[lightboxItem.src] ? (
                <div className="flex min-h-[240px] w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl border border-[#DDD4BE] bg-white p-6 text-center text-sm text-[#57534E] dark:border-[#243047] dark:bg-[#161D2B] dark:text-[#94A3B8]">
                  <ImageOff className="h-7 w-7" aria-hidden="true" />
                  <span>Не вдалося завантажити ілюстрацію у високій роздільності</span>
                  <button
                    type="button"
                    onClick={() => handleRetryImage(lightboxItem.src)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#DDD4BE] bg-[#FBF9F5] px-4 py-2 text-xs font-semibold text-[#1E3A8A] hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#F59E0B]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Повторити завантаження</span>
                  </button>
                </div>
              ) : (
                <img
                  key={`${lightboxItem.src}-${retryCounts[lightboxItem.src] ?? 0}`}
                  src={getDisplaySrc(lightboxItem.src)}
                  alt={lightboxItem.alt}
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed(lightboxItem.src)}
                  className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              )}
            </div>

            <div className="border-t border-[#E5DEC9] bg-white px-4 py-3.5 text-sm leading-relaxed text-[#292524] sm:px-6 dark:border-[#243047] dark:bg-[#161D2B] dark:text-[#CBD5E1]">
              <RichText text={lightboxItem.caption} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
