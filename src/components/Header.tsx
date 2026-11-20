import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { SearchResult } from '../types/portal';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResult[];
  onSelectSearchResult: (result: SearchResult) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  completedCount: number;
  totalChapters: number;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectSearchResult,
  isDark,
  onToggleTheme,
  completedCount,
  totalChapters,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 min-h-16 border-b border-[#E5DEC9] bg-[#FBF9F5]/92 backdrop-blur-md dark:border-[#243047] dark:bg-[#0F141E]/92">
      <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:h-16 md:flex-nowrap md:gap-6 md:py-0">
        {/* Zone 1: Menu toggle (mobile) + Single-line Brand Wordmark */}
        <div className="order-1 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Закрити меню розділів' : 'Відкрити меню розділів'}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E5DEC9] bg-white text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 shrink-0 max-w-[280px] sm:max-w-md lg:max-w-lg">
            <BookOpen className="h-5 w-5 text-[#1E3A8A] dark:text-[#F59E0B] shrink-0" aria-hidden="true" />
            <span className="font-editorial text-xs sm:text-sm md:text-base font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] truncate" title="Тема 12. Українські землі у складі Російської імперії наприкінці XVIII — в першій половині XIX ст.">
              Тема 12. Українські землі у складі Російської імперії наприкінці XVIII — в першій половині XIX ст.
            </span>
          </div>
        </div>

        {/* Zone 2: Global Live Search (full-width second row on < md, centered on md+) */}
        <div ref={searchWrapperRef} className="order-3 relative w-full min-w-0 basis-full md:order-2 md:basis-auto md:flex-1 md:max-w-xl">
          <label htmlFor="global-portal-search" className="sr-only">
            Глобальний пошук за датою, прізвищем, терміном чи цитатою
          </label>
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-[#78716C] dark:text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              id="global-portal-search"
              type="search"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder="Пошук по 10 розділах: дата, прізвище, термін, цитата..."
              className="h-10 w-full rounded-lg border border-[#DDD4BE] bg-white pl-9 pr-9 text-sm text-[#1C1917] placeholder-[#78716C] transition-colors focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:placeholder-[#8B97AD] dark:focus:border-[#60A5FA] md:h-11"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                aria-label="Очистити пошук"
                className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#78716C] hover:bg-[#F3EFE6] hover:text-[#1C1917] dark:text-[#94A3B8] dark:hover:bg-[#1D2638] dark:hover:text-[#F4F1EA]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isDropdownOpen && searchQuery.trim().length >= 2 && (
            <div
              role="region"
              aria-label="Результати глобального пошуку"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-[#DDD4BE] bg-white shadow-xl dark:border-[#2A354D] dark:bg-[#161D2B]"
            >
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#57534E] dark:text-[#A8B2C5]">
                  За запитом «{searchQuery.trim()}» нічого не знайдено. Спробуйте іншу дату, прізвище чи термін.
                </div>
              ) : (
                <div className="divide-y divide-[#EFEAE0] dark:divide-[#243047]">
                  <div className="px-4 py-2 text-xs font-medium text-[#78716C] dark:text-[#94A3B8]">
                    Знайдено збігів: <span className="tabular-nums font-semibold">{searchResults.length}</span>
                  </div>
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectSearchResult(item);
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-[#F7F4EC] focus-visible:bg-[#F7F4EC] focus-visible:outline-none dark:hover:bg-[#1D2638] dark:focus-visible:bg-[#1D2638]"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#78716C] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#B45309] dark:text-[#F59E0B]">{item.kind}</span>
                        <span aria-hidden="true">·</span>
                        <span>Розділ {item.chapterId}: {item.chapterTitle}</span>
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-[#1C1917] dark:text-[#F4F1EA]">
                        {item.title}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#57534E] dark:text-[#A8B2C5]">
                        {item.snippet}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Progress Summary + Dark Mode Toggle */}
        <div className="order-2 flex items-center gap-2.5 shrink-0 md:order-3 md:gap-3">
          <span className="hidden md:inline-block text-xs font-medium text-[#57534E] dark:text-[#A8B2C5] tabular-nums whitespace-nowrap shrink-0">
            Вивчено {completedCount}/{totalChapters}
          </span>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-lg border border-[#DDD4BE] bg-white px-3 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] whitespace-nowrap shrink-0"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-[#F59E0B]" />
                <span className="hidden sm:inline">Світла тема</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#1E3A8A]" />
                <span className="hidden sm:inline">Темна тема</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
