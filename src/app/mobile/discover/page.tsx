'use client';

import { Globe2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SmallNewsCard from '@/components/Discover/SmallNewsCard';

export interface Discover {
  title: string;
  content: string;
  url: string;
  thumbnail: string;
}

const topics: { key: string; display: string }[] = [
  { display: 'Tech & Science', key: 'tech' },
  { display: 'Finance', key: 'finance' },
  { display: 'Art & Culture', key: 'art' },
  { display: 'Sports', key: 'sports' },
  { display: 'Entertainment', key: 'entertainment' },
];

const Page = () => {
  const [discover, setDiscover] = useState<Discover[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string>(topics[0].key);

  const fetchArticles = async (topic: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover?topic=${topic}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      data.blogs = data.blogs.filter((blog: Discover) => blog.thumbnail);
      setDiscover(data.blogs);
    } catch (err: any) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(activeTopic);
  }, [activeTopic]);

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Globe2Icon size={32} />
        <h1 className="text-3xl font-normal" style={{ fontFamily: 'PP Editorial, serif' }}>
          Discover
        </h1>
      </div>

      <div className="flex flex-row items-center gap-2 overflow-x-auto scrollbar-none pb-4 -mx-4 px-4">
        {topics.map((t) => (
          <button
            key={t.key}
            className={cn(
              'whitespace-nowrap rounded-full text-sm px-4 py-1.5 transition duration-200',
              activeTopic === t.key
                ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-300/20 border border-cyan-700/60 dark:border-cyan-300/40'
                : 'text-black/70 dark:text-white/70 border border-black/30 dark:border-white/30 hover:text-black dark:hover:text-white',
            )}
            onClick={() => setActiveTopic(t.key)}
          >
            {t.display}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <svg aria-hidden="true" className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z" fill="currentFill" />
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-8">
          {discover?.map((item, i) => (
            <SmallNewsCard key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
