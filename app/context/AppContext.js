"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('stre4mit_watchlist');
    const savedHistory = localStorage.getItem('stre4mit_history');

    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (e) {
        console.error("Failed to parse watchlist", e);
      }
    }
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    setIsLoaded(true);
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

  const addToWatchlist = (item) => {
    setWatchlist((prev) => {
      // Ensure we store essential fields
      const exists = prev.some((i) => i.id === item.id && (i.media_type || 'movie') === (item.media_type || 'movie'));
      if (exists) return prev;
      return [item, ...prev];
    });
  };

  const removeFromWatchlist = (id, media_type) => {
    setWatchlist((prev) => prev.filter((i) => !(i.id === id && (i.media_type || 'movie') === (media_type || 'movie'))));
  };

  const isInWatchlist = (id, media_type) => {
    return watchlist.some((i) => i.id === id && (i.media_type || 'movie') === (media_type || 'movie'));
  };

  const addToHistory = (item) => {
    setHistory((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && (i.media_type || 'movie') === (item.media_type || 'movie')));
      return [
        { ...item, watchedAt: new Date().toISOString() },
        ...filtered
      ].slice(0, 20); // Keep last 20 watched items
    });
  };

  const removeFromHistory = (id, media_type) => {
    setHistory((prev) => prev.filter((i) => !(i.id === id && (i.media_type || 'movie') === (media_type || 'movie'))));
  };

  return (
    <AppContext.Provider
      value={{
        watchlist,
        history,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        addToHistory,
        removeFromHistory,
        isLoaded
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
