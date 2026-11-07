"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

const AppContext = createContext();

const NON_LATIN_CLIENT_RE = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;

function itemNeedsRomanization(item) {
  if (!item) return false;
  return (
    NON_LATIN_CLIENT_RE.test(item.title || '') ||
    NON_LATIN_CLIENT_RE.test(item.name || '')
  );
}

export function AppProvider({ children }) {
  const pathname = usePathname();
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigation history refs for clean 1-click exit from /watch and @modal
  const lastBrowsePathRef = useRef('/');
  const canStepBackToBrowseRef = useRef(false);
  const startedOnFullDetailRef = useRef(false);
  const prevPathRef = useRef(null);
  const cameFromWatchRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;

    const isWatch = pathname.startsWith('/watch');
    const isDetailOrPerson =
      pathname.startsWith('/movie/') ||
      pathname.startsWith('/tv/') ||
      pathname.startsWith('/person/');
    const isBrowse = !isWatch && !isDetailOrPerson;

    if (prevPathRef.current === null && isDetailOrPerson) {
      startedOnFullDetailRef.current = true;
    }

    cameFromWatchRef.current = Boolean(prevPathRef.current?.startsWith('/watch'));

    if (isBrowse) {
      const qs = typeof window !== 'undefined' ? window.location.search : '';
      lastBrowsePathRef.current = `${pathname}${qs}`;
      canStepBackToBrowseRef.current = true;
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  // Load from localStorage on mount. State updates are deferred to the next
  // animation frame so the synchronous effect body never triggers cascading
  // re-renders right after hydration.
  useEffect(() => {
    let cancelled = false;

    const frame = requestAnimationFrame(async () => {
      let parsedWatchlist = [];
      let parsedHistory = [];

      const savedWatchlist = localStorage.getItem('stre4mit_watchlist');
      const savedHistory = localStorage.getItem('stre4mit_history');
      const savedReminders = localStorage.getItem('stre4mit_reminders');

      if (savedWatchlist) {
        try {
          parsedWatchlist = JSON.parse(savedWatchlist) || [];
          setWatchlist(parsedWatchlist);
        } catch (e) {
          console.error("Failed to parse watchlist", e);
        }
      }
      if (savedHistory) {
        try {
          parsedHistory = JSON.parse(savedHistory) || [];
          setHistory(parsedHistory);
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
      if (savedReminders) {
        try {
          setReminders(JSON.parse(savedReminders) || []);
        } catch (e) {
          console.error("Failed to parse reminders", e);
        }
      }
      setIsLoaded(true);

      // Migrate any previously saved non-Latin titles in localStorage once via server romanizer
      const dirtyTexts = new Set();
      [...parsedWatchlist, ...parsedHistory].forEach((item) => {
        if (itemNeedsRomanization(item)) {
          if (item.title) dirtyTexts.add(item.title);
          if (item.name) dirtyTexts.add(item.name);
        }
      });

      if (dirtyTexts.size > 0) {
        try {
          const sourceList = Array.from(dirtyTexts);
          const res = await fetch('/api/romanize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: sourceList }),
          });
          if (res.ok && !cancelled) {
            const { results } = await res.json();
            const map = new Map();
            sourceList.forEach((orig, idx) => {
              if (results?.[idx]) map.set(orig, results[idx]);
            });

            if (parsedWatchlist.some(itemNeedsRomanization)) {
              setWatchlist((prev) =>
                prev.map((it) => ({
                  ...it,
                  title: map.get(it.title) || it.title,
                  name: map.get(it.name) || it.name,
                }))
              );
            }
            if (parsedHistory.some(itemNeedsRomanization)) {
              setHistory((prev) =>
                prev.map((it) => ({
                  ...it,
                  title: map.get(it.title) || it.title,
                  name: map.get(it.name) || it.name,
                }))
              );
            }
          }
        } catch (err) {
          console.error("Failed to romanize cached localStorage items", err);
        }
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  // Save to localStorage when watchlist changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('stre4mit_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, isLoaded]);

  // Save to localStorage when history changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('stre4mit_history', JSON.stringify(history));
    }
  }, [history, isLoaded]);

  // Save to localStorage when reminders change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('stre4mit_reminders', JSON.stringify(reminders));
    }
  }, [reminders, isLoaded]);

  const addToWatchlist = useCallback((item) => {
    setWatchlist((prev) => {
      const exists = prev.some((i) => i.id === item.id && (i.media_type || 'movie') === (item.media_type || 'movie'));
      if (exists) return prev;
      return [item, ...prev];
    });
  }, []);

  const removeFromWatchlist = useCallback((id, media_type) => {
    setWatchlist((prev) => prev.filter((i) => !(i.id === id && (i.media_type || 'movie') === (media_type || 'movie'))));
  }, []);

  const isInWatchlist = useCallback((id, media_type) => {
    return watchlist.some((i) => i.id === id && (i.media_type || 'movie') === itemMediaTypeFallback(media_type));
  }, [watchlist]);

  const addToHistory = useCallback((item) => {
    setHistory((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && (i.media_type || 'movie') === (item.media_type || 'movie')));
      return [
        { ...item, watchedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, 20);
    });
  }, []);

  const removeFromHistory = useCallback((id, media_type) => {
    setHistory((prev) => prev.filter((i) => !(i.id === id && (i.media_type || 'movie') === (media_type || 'movie'))));
  }, []);

  const hasReminder = useCallback((id, media_type) => {
    const type = itemMediaTypeFallback(media_type);
    return reminders.some((r) => r.id === id && itemMediaTypeFallback(r.media_type) === type);
  }, [reminders]);

  const toggleReminder = useCallback((item) => {
    if (!item?.id) return;
    const type = itemMediaTypeFallback(item.media_type);
    setReminders((prev) => {
      const exists = prev.some((r) => r.id === item.id && itemMediaTypeFallback(r.media_type) === type);
      if (exists) {
        return prev.filter((r) => !(r.id === item.id && itemMediaTypeFallback(r.media_type) === type));
      }
      return [{ id: item.id, media_type: type }, ...prev];
    });
    // Also ensure reminded title is saved in My List so the user can easily revisit it
    setWatchlist((prev) => {
      const exists = prev.some((i) => i.id === item.id && itemMediaTypeFallback(i.media_type) === type);
      if (exists) return prev;
      return [{ ...item, media_type: type }, ...prev];
    });
  }, []);

  const exitWatchPlayer = useCallback((router) => {
    if (
      (canStepBackToBrowseRef.current || startedOnFullDetailRef.current) &&
      typeof window !== 'undefined' &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.replace(lastBrowsePathRef.current || '/');
    }
  }, []);

  const closeDetailModal = useCallback((router) => {
    if (
      canStepBackToBrowseRef.current &&
      !cameFromWatchRef.current &&
      typeof window !== 'undefined' &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.replace(lastBrowsePathRef.current || '/');
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        watchlist,
        history,
        reminders,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        addToHistory,
        removeFromHistory,
        hasReminder,
        toggleReminder,
        exitWatchPlayer,
        closeDetailModal,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function itemMediaTypeFallback(media_type) {
  return media_type || 'movie';
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
