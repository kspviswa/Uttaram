'use client';

import { useEffect, useState } from 'react';
import EmptyChatMessageInput from '@/components/EmptyChatMessageInput';
import WeatherWidget from '@/components/WeatherWidget';
import NewsArticleWidget from '@/components/NewsArticleWidget';
import {
  getShowNewsWidget,
  getShowWeatherWidget,
  getUserName,
  getLocation,
} from '@/lib/config/clientRegistry';
import { useChat } from '@/lib/hooks/useChat';
import Chat from '@/components/Chat';
import Navbar from '@/components/Navbar';
import Loader from '@/components/ui/Loader';

const MobileHome = () => {
  const { messages, isReady, chatId } = useChat();
  const [showWeather, setShowWeather] = useState(() =>
    typeof window !== 'undefined' ? getShowWeatherWidget() : true,
  );
  const [showNews, setShowNews] = useState(() =>
    typeof window !== 'undefined' ? getShowNewsWidget() : true,
  );

  const greeting = (() => {
    if (typeof window === 'undefined') return 'Research begins here.';
    const name = getUserName();
    const hour = new Date().getHours();
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';
    return name ? `${timeGreeting}, ${name}.` : 'Research begins here.';
  })();

  const subGreeting = (() => {
    if (typeof window === 'undefined') return '';
    const name = getUserName();
    const loc = getLocation();
    if (name && loc) return `Welcome back from ${loc}. What would you like to explore today?`;
    if (name) return 'What would you like to explore today?';
    return '';
  })();

  useEffect(() => {
    const update = () => {
      setShowWeather(getShowWeatherWidget());
      setShowNews(getShowNewsWidget());
    };
    update();
    window.addEventListener('client-config-changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('client-config-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader />
      </div>
    );
  }

  if (messages.length > 0 && chatId) {
    return (
      <div className="flex flex-col h-full">
        <Navbar />
        <div className="flex-1 px-4">
          <Chat />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-8">
      <div className="flex flex-col items-center w-full max-w-sm space-y-2">
        <h1 className="text-black dark:text-white text-4xl font-light tracking-tight">
          <span style={{ fontFamily: "'Noto Sans Devanagari','Nirmala UI',sans-serif" }}>ऊ</span>ttaram
        </h1>
        <h2 className="text-black/70 dark:text-white/70 text-2xl font-medium text-center">
          {greeting}
        </h2>
        {subGreeting && (
          <p className="text-black/50 dark:text-white/50 text-sm text-center">
            {subGreeting}
          </p>
        )}
        <div className="h-4" />
        <EmptyChatMessageInput />
      </div>
      {(showWeather || showNews) && (
        <div className="flex flex-col w-full max-w-sm gap-4 mt-6 pb-8">
          {showWeather && <WeatherWidget />}
          {showNews && <NewsArticleWidget />}
        </div>
      )}
    </div>
  );
};

export default MobileHome;
