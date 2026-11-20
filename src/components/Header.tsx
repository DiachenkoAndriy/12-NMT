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
  readingProgress?: number | null;
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
  readingProgress = null,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileSearchOpen(false);
    }
  }, [isMobileMenuOpen]);

  // Global Ctrl+K / Cmd+K shortcut & Escape closing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
          window.setTimeout(() => mobileInputRef.current?.focus(), 40);
        } else {
          desktopInputRef.current?.focus();
          setIsDropdownOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        desktopInputRef.current?.blur();
        mobileInputRef.current?.blur();
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsMobileSearchOpen(false);
      e.currentTarget.blur();
    }
  };

  const renderSearchResults = (onAfterSelect?: () => void) => {
    if (searchQuery.trim().length < 2) return null;
    return (
      <div
        role="region"
        aria-label="Результати глобального пошуку"
        className="max-h-[70vh] overflow-y-auto rounded-xl border border-[#DDD4BE] bg-white shadow-xl dark:border-[#2A354D] dark:bg-[#161D2B]"
      >
        {searchResults.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[#57534E] dark:text-[#A8B2C5]">
            За запитом «{searchQuery.trim()}» нічого не знайдено. Спробуйте іншу дату, прізвище чи термін.
          </div>
        ) : (
          <div className="divide-y divide-[#EFEAE0] dark:divide-[#243047]">
            <div className="px-4 py-2 text-xs font-medium text-[#78716C] dark:text-[#94A3B8]">
              Знайдено збігів: <span className="font-semibold tabular-nums">{searchResults.length}</span>
            </div>
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSearchResult(item);
                  onSearchChange('');
                  setIsDropdownOpen(false);
                  setIsMobileSearchOpen(false);
                  desktopInputRef.current?.blur();
                  mobileInputRef.current?.blur();
                  onAfterSelect?.();
                }}
                className="block w-full px-4 py-3 text-left transition-colors hover:bg-[#F7F4EC] focus-visible:bg-[#F7F4EC] focus-visible:outline-none dark:hover:bg-[#1D2638] dark:focus-visible:bg-[#1D2638]"
              >
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#78716C] dark:text-[#94A3B8]">
                  <span className="font-semibold text-[#B45309] dark:text-[#F59E0B]">{item.kind}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Розділ {item.chapterId}: {item.chapterTitle}
                  </span>
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
    );
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#E5DEC9] bg-[#FBF9F5]/92 backdrop-blur-md dark:border-[#243047] dark:bg-[#0F141E]/92">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 md:gap-8">
        {/* Zone 1: Menu toggle (mobile/tablet) + Clean Single-line Brand Wordmark */}
        <div className="flex min-w-0 items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchOpen(false);
              onToggleMobileMenu();
            }}
            aria-label={isMobileMenuOpen ? 'Закрити меню розділів' : 'Відкрити меню розділів'}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E5DEC9] bg-white text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <BookOpen className="h-5 w-5 shrink-0 text-[#1E3A8A] dark:text-[#F59E0B]" aria-hidden="true" />
            <span
              className="font-editorial text-sm font-bold tracking-tight text-[#1C1917] dark:text-[#F4F1EA] sm:text-base"
              title="Тема 12. Українські землі у складі Російської імперії наприкінці XVIII — в першій половині XIX ст."
            >
              <span className="sm:hidden">Тема 12 · НМТ</span>
              <span className="hidden sm:inline">Тема 12 · Історія України (НМТ)</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Global Live Search */}
        <div ref={searchWrapperRef} className="relative hidden min-w-0 flex-1 max-w-xl md:block">
          <label htmlFor="global-portal-search" className="sr-only">
            Глобальний пошук за датою, прізвищем, терміном чи цитатою
          </label>
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-[#78716C] dark:text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              ref={desktopInputRef}
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
              className="h-10 w-full rounded-lg border border-[#DDD4BE] bg-white pl-9 pr-16 text-sm text-[#1C1917] placeholder-[#78716C] transition-colors focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:placeholder-[#8B97AD] dark:focus:border-[#60A5FA]"
            />
            {searchQuery ? (
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
            ) : (
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 hidden rounded border border-[#E5DEC9] bg-[#F7F4EC] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#78716C] lg:inline-block dark:border-[#2A354D] dark:bg-[#0F141E] dark:text-[#8B97AD]"
              >
                Ctrl+K
              </kbd>
            )}
          </div>

          {isDropdownOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50">
              {renderSearchResults()}
            </div>
          )}
        </div>

        {/* Zone 3: Mobile Search Trigger + Progress Summary + Dark Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0 md:gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !isMobileSearchOpen;
              setIsMobileSearchOpen(next);
              if (next) {
                window.setTimeout(() => mobileInputRef.current?.focus(), 40);
              }
            }}
            aria-label={isMobileSearchOpen ? 'Закрити панель пошуку' : 'Відкрити пошук по курсу'}
            aria-expanded={isMobileSearchOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DDD4BE] bg-white text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] md:hidden"
          >
            {isMobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          <span className="hidden text-xs font-medium text-[#57534E] dark:text-[#A8B2C5] tabular-nums whitespace-nowrap shrink-0 md:inline-block">
            Вивчено {completedCount}/{totalChapters}
          </span>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-lg border border-[#DDD4BE] bg-white px-2.5 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:hover:bg-[#1D2638] sm:px-3 whitespace-nowrap shrink-0"
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

      {/* Expandable Mobile Search Drawer (below 64px header) */}
      {isMobileSearchOpen && (
        <div className="border-b border-[#E5DEC9] bg-[#FBF9F5] px-4 py-3 shadow-lg dark:border-[#243047] dark:bg-[#0F141E] md:hidden">
          <label htmlFor="mobile-portal-search" className="sr-only">
            Пошук по 10 розділах: дата, прізвище, термін, цитата
          </label>
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-[#78716C] dark:text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              ref={mobileInputRef}
              id="mobile-portal-search"
              type="search"
              value={searchQuery}
              onKeyDown={handleKeyDown}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Дата, прізвище, термін, цитата..."
              className="h-11 w-full rounded-lg border border-[#DDD4BE] bg-white pl-9 pr-9 text-sm text-[#1C1917] placeholder-[#78716C] focus:border-[#1E3A8A] focus:outline-none dark:border-[#2A354D] dark:bg-[#161D2B] dark:text-[#F4F1EA] dark:placeholder-[#8B97AD] dark:focus:border-[#60A5FA]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Очистити пошук"
                className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#78716C] hover:bg-[#F3EFE6] dark:text-[#94A3B8] dark:hover:bg-[#1D2638]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery.trim().length >= 2 && (
            <div className="mt-2">{renderSearchResults()}</div>
          )}
        </div>
      )}

      {/* Subtle reading depth progress line along bottom edge of header */}
      {readingProgress !== null && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-transparent"
          aria-hidden="true"
        >
          <div
            className="h-full bg-[#1E3A8A] transition-[width] duration-150 dark:bg-[#F59E0B]"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}
    </header>
  );
};
