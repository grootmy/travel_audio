import React, { useState, useEffect, useTransition } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import type { PageType } from '@/types';

export default function App() {
  const [page, setPage] = useState<PageType>('home');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return !window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return false;
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handlePageChange = (newPage: PageType) => {
    startTransition(() => {
      setPage(newPage);
    });
  };

  const handleThemeToggle = () => {
    startTransition(() => {
      setDarkMode(!darkMode);
    });
  };

  const renderPage = () => {
    switch (page) {
      case 'chat':
        return <ChatPage setPage={handlePageChange} />;
      case 'home':
      default:
        return <HomePage setPage={handlePageChange} />;
    }
  };

  return (
    <div className="w-full h-screen font-sans antialiased">
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="outline"
          size="icon"
          onClick={handleThemeToggle}
          disabled={isPending}
          className="transition-all duration-200 hover:scale-105 focus-visible:scale-105"
          aria-label={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 전환</span>
        </Button>
      </div>
      
      <main className="w-full h-full mx-auto relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
} 