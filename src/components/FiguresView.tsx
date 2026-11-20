import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Search, Users, X } from 'lucide-react';
import { HistoricalFigure } from '../types/portal';
import { filterFigures } from '../utils/portalLogic';

interface FiguresViewProps {
  figures: HistoricalFigure[];
  onOpenChapter: (chapterId: number) => void;
}

const FIGURE_CATEGORIES = [
  'Усі',
  'Політика та рух',
  'Освіта та наука',
  'Література та преса',
  'Мистецтво та архітектура',
  'Військова справа та підприємництво',
] as const;

export const FiguresView: React.FC<FiguresViewProps> = ({ figures, onOpenChapter }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Усі');

  const filtered = useMemo(
    () => filterFigures(figures, query, selectedCategory),
    [figures, query, selectedCategory],
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="border-b border-[#E5DEC9] pb-6 dark:border-[#243047]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>Історичні постаті курсу · Персоналії НМТ</span>
        </div>
        <h1 className="mt-2 font-editorial text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-3xl lg:text-4xl">
          Довідник персоналій
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57534E] dark:text-[#A8B2C5] sm:text-base">
          Усі визначні діячі українських земель у складі Російської імперії кінця XVIII — першої половини XIX ст. з їхніми ролями, головними досягненнями та ключовими маркерами тестів НМТ.
        </p>
      </header>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <label htmlFor="figures-search" className="sr-only">
            Пошук у довіднику персоналій за прізвищем або досягненням
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C] dark:text-[#94A3B8]"
            aria-hidden="true"
          />
          <input
            id="figures-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за прізвищем, роллю чи твором..."
            className="h-11 w-full rounded-lg border border-[#DDD4BE] bg-white pl-9 pr-9 text-sm text-[#1C1917] placeholder-[#78716C] focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:placeholder-[#8B97AD] dark:focus:border-[#60A5FA]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Очистити фільтр персоналій"
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#78716C] hover:bg-[#F3EFE6] dark:text-[#94A3B8] dark:hover:bg-[#1D2638]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1" role="group" aria-label="Фільтр сфер діяльності">
          {FIGURE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`min-h-[40px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === category
                  ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-[#F59E0B] dark:bg-[#F59E0B] dark:text-[#0F141E]'
                  : 'border-[#DDD4BE] bg-white text-[#57534E] hover:bg-[#F3EFE6] hover:text-[#1C1917] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#A8B2C5] dark:hover:bg-[#1D2638] dark:hover:text-[#F4F1EA]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs font-medium text-[#78716C] dark:text-[#94A3B8] tabular-nums">
        Показано постатей: <strong className="text-[#1C1917] dark:text-[#F4F1EA]">{filtered.length}</strong> з {figures.length}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#DDD4BE] bg-white p-10 text-center dark:border-[#243047] dark:bg-[#161D2B]">
          <p className="text-base font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
            За вашим запитом постатей не знайдено
          </p>
          <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8B2C5]">
            Очистіть рядок пошуку або виберіть категорію «Усі».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((fig) => (
            <article
              key={fig.id}
              className="flex flex-col justify-between rounded-2xl border border-[#DDD4BE] bg-white p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-colors hover:border-[#1E3A8A]/35 sm:p-6 dark:border-[#243047] dark:bg-[#161D2B] dark:hover:border-[#F59E0B]/35"
            >
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#F4F1EA]">
                    {fig.name}
                  </h2>
                  {fig.years && (
                    <span className="font-mono text-xs font-medium tabular-nums text-[#78716C] dark:text-[#94A3B8]">
                      {fig.years}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#B45309] dark:text-[#F59E0B]">
                  <span className="font-semibold">{fig.sphere}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#78716C] dark:text-[#94A3B8]">{fig.category}</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[#292524] dark:text-[#CBD5E1]">
                  {fig.achievements}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EFEAE0] pt-3 dark:border-[#243047]">
                {fig.chapterIds.map((chId) => (
                  <button
                    key={chId}
                    type="button"
                    onClick={() => onOpenChapter(chId)}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-[#DDD4BE] bg-[#FBF9F5] px-2.5 py-1 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#93C5FD] dark:hover:bg-[#1D2638] whitespace-nowrap"
                  >
                    <span>Розділ {chId}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
