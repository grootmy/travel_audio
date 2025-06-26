import React, { useState, useEffect, useTransition } from 'react';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import type { PageType } from '@/types';

export default function App() {
  const [page, setPage] = useState<PageType>('home');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  const handlePageChange = (newPage: PageType) => {
    startTransition(() => {
      setPage(newPage);
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