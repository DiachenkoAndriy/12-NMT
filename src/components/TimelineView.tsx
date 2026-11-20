import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Search, X } from 'lucide-react';
import { TimelineEvent } from '../types/portal';
import { filterTimeline, TimelineDecade } from '../utils/portalLogic';
import { ReadableText } from './ReadableText';

interface TimelineViewProps {
  events: TimelineEvent[];
  onOpenChapter: (chapterId: number) => void;
}

const CATEGORIES = [
  'Усі',
  'Геополітика та війни',
  'Економіка та побут',
  'Національний та суспільний рух',
  'Освіта, наука та культура',
] as const;

const DECADES: TimelineDecade[] = [
  'Усі',
  '1790-ті',
  '1800–1810-ті',
  '1820-ті',
  '1830-ті',
  '1840–1850-ті',
];

export const TimelineView: React.FC<TimelineViewProps> = ({ events, onOpenChapter }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Усі');
  const [selectedDecade, setSelectedDecade] = useState<TimelineDecade>('Усі');

  const filteredEvents = useMemo(
    () => filterTimeline(events, query, selectedCategory, selectedDecade),
    [events, query, selectedCategory, selectedDecade],
  );

  const hasActiveFilters = query !== '' || selectedCategory !== 'Усі' || selectedDecade !== 'Усі';

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('Усі');
    setSelectedDecade('Усі');
  };

  return (
    <section className="animate-view-in mx-auto max-w-5xl space-y-6 pb-12">
      <header className="border-b border-[#E5DEC9] pb-6 dark:border-[#243047]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>Повна таблиця дат курсу · 1791–1856 рр.</span>
        </div>
        <h1 className="mt-2 font-editorial text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-3xl lg:text-4xl">
          Зведена хронологія (1791–1856 рр.)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57534E] dark:text-[#A8B2C5] sm:text-base">
          Усі ключові дати, війни, мирні договори, повстання та культурні події українських земель у складі Російської імперії наприкінці XVIII — в першій половині XIX ст. із маркерами для завдань НМТ.
        </p>
      </header>

      {/* Search, Decade & Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <label htmlFor="timeline-search" className="sr-only">
              Пошук у зведеній хронології за роком або подією
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C] dark:text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              id="timeline-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Фільтр за датою чи подією (напр. 1834 або Бухарест)..."
              className="h-11 w-full rounded-lg border border-[#DDD4BE] bg-white pl-9 pr-9 text-sm text-[#1C1917] placeholder-[#78716C] focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:placeholder-[#8B97AD] dark:focus:border-[#60A5FA]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Очистити фільтр хронології"
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#78716C] hover:bg-[#F3EFE6] dark:text-[#94A3B8] dark:hover:bg-[#1D2638]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="self-start text-xs font-semibold text-[#1E3A8A] hover:underline dark:text-[#F59E0B] sm:self-auto"
            >
              Скинути всі фільтри
            </button>
          )}
        </div>

        {/* Decade quick filter */}
        <div
          className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5"
          role="group"
          aria-label="Фільтр за десятиліттями"
        >
          {DECADES.map((decade) => (
            <button
              key={decade}
              type="button"
              onClick={() => setSelectedDecade(decade)}
              aria-pressed={selectedDecade === decade}
              className={`min-h-[36px] rounded-md border px-3 py-1 font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedDecade === decade
                  ? 'border-[#B45309] bg-[#FEF3C7]/70 text-[#78350F] dark:border-[#F59E0B] dark:bg-[#451A03]/50 dark:text-[#FBBF24]'
                  : 'border-[#E5DEC9] bg-[#F7F4EC]/70 text-[#57534E] hover:bg-[#EFEAE0] dark:border-[#243047] dark:bg-[#131A26] dark:text-[#94A3B8] dark:hover:bg-[#1D2638]'
              }`}
            >
              {decade === 'Усі' ? 'Усі роки' : decade}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div
          className="flex overflow-x-auto no-scrollbar gap-2 pb-1"
          role="group"
          aria-label="Фільтр категорій хронології"
        >
          {CATEGORIES.map((category) => (
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

      {/* Results Count */}
      <div className="text-xs font-medium text-[#78716C] dark:text-[#94A3B8] tabular-nums">
        Показано подій: <strong className="text-[#1C1917] dark:text-[#F4F1EA]">{filteredEvents.length}</strong> з {events.length}
      </div>

      {/* Empty State / Responsive Cards (Mobile) + Table (Desktop) */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-[#DDD4BE] bg-white p-10 text-center dark:border-[#243047] dark:bg-[#161D2B]">
          <p className="text-base font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
            Подій за вашим запитом не знайдено
          </p>
          <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8B2C5]">
            Спробуйте змінити пошукове слово або скинути фільтри.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#DDD4BE] bg-[#FBF9F5] px-4 py-2 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#F59E0B]"
          >
            Скинути всі фільтри
          </button>
        </div>
      ) : (
        <>
          {/* Mobile stacked chronological cards (zero horizontal scroll) */}
          <div className="space-y-3 md:hidden">
            {filteredEvents.map((ev) => (
              <article
                key={ev.id}
                className="rounded-xl border border-[#DDD4BE] bg-white p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:border-[#243047] dark:bg-[#161D2B]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold tabular-nums text-[#1E3A8A] dark:text-[#F59E0B]">
                    {ev.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenChapter(ev.chapterId)}
                    className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-md border border-[#DDD4BE] bg-[#FBF9F5] px-2.5 py-1 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#93C5FD] dark:hover:bg-[#1D2638] whitespace-nowrap"
                  >
                    <span>Розділ {ev.chapterId}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <ReadableText
                  text={ev.event}
                  listLengthThreshold={100}
                  sentenceThreshold={230}
                  preferListForLongText={true}
                  className="mt-2 text-sm leading-relaxed text-[#1C1917] dark:text-[#E2E8F0]"
                />
                <div className="mt-2 text-xs text-[#78716C] dark:text-[#94A3B8]">{ev.category}</div>
              </article>
            ))}
          </div>

          {/* Desktop editorial broadsheet table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#DDD4BE] bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] md:block dark:border-[#243047] dark:bg-[#161D2B]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5DEC9] bg-[#F3EFE6] dark:border-[#243047] dark:bg-[#1D2638]">
                  <th scope="col" className="w-52 px-4 py-3.5 font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                    Дата
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                    Подія та маркери НМТ
                  </th>
                  <th scope="col" className="w-36 px-4 py-3.5 font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                    Розділ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0] dark:divide-[#243047]">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="transition-colors hover:bg-[#FBF9F5] dark:hover:bg-[#1A2334]">
                    <td className="px-4 py-3.5 align-top font-mono text-xs font-semibold tabular-nums text-[#1E3A8A] dark:text-[#F59E0B] sm:text-sm">
                      {ev.date}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <ReadableText
                        text={ev.event}
                        listLengthThreshold={100}
                        sentenceThreshold={230}
                        preferListForLongText={true}
                        className="leading-relaxed text-[#1C1917] dark:text-[#E2E8F0]"
                      />
                      <div className="mt-1.5 text-xs text-[#78716C] dark:text-[#94A3B8]">{ev.category}</div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <button
                        type="button"
                        onClick={() => onOpenChapter(ev.chapterId)}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-[#DDD4BE] bg-[#FBF9F5] px-2.5 py-1 text-xs font-semibold text-[#1E3A8A] transition-colors hover:bg-[#EFEAE0] dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#93C5FD] dark:hover:bg-[#1D2638] whitespace-nowrap"
                      >
                        <span>Розділ {ev.chapterId}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
