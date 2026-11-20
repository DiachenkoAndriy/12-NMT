import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Search, X } from 'lucide-react';
import { TimelineEvent } from '../types/portal';
import { filterTimeline } from '../utils/portalLogic';

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

export const TimelineView: React.FC<TimelineViewProps> = ({ events, onOpenChapter }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Усі');

  const filteredEvents = useMemo(
    () => filterTimeline(events, query, selectedCategory),
    [events, query, selectedCategory],
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-12">
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

      {/* Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
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

        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1" role="group" aria-label="Фільтр категорій хронології">
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

      {/* Table / Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-[#DDD4BE] bg-white p-10 text-center dark:border-[#243047] dark:bg-[#161D2B]">
          <p className="text-base font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
            Подій за вашим запитом не знайдено
          </p>
          <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8B2C5]">
            Спробуйте змінити пошукове слово або оберіть категорію «Усі».
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#DDD4BE] bg-white dark:border-[#243047] dark:bg-[#161D2B]">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
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
                    <p className="leading-relaxed text-[#1C1917] dark:text-[#E2E8F0]">{ev.event}</p>
                    <div className="mt-1 text-xs text-[#78716C] dark:text-[#94A3B8]">{ev.category}</div>
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
      )}
    </section>
  );
};
