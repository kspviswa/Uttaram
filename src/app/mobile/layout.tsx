'use client';

import { cn } from '@/lib/utils';
import {
  BookOpenText,
  BrainCircuit,
  BarChart3,
  Home,
  Search,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import { ReactNode } from 'react';

const navLinks = [
  { icon: Home, href: '/mobile', label: 'Home', match: (s: string[]) => s.length === 0 || s.includes('c') },
  { icon: Search, href: '/mobile/discover', label: 'Discover', match: (s: string[]) => s.includes('discover') },
  { icon: BookOpenText, href: '/mobile/library', label: 'Library', match: (s: string[]) => s.includes('library') },
  { icon: BrainCircuit, href: '/mobile/memories', label: 'Memories', match: (s: string[]) => s.includes('memories') },
  { icon: BarChart3, href: '/mobile/analytics', label: 'Analytics', match: (s: string[]) => s.includes('analytics') },
  { icon: Settings, href: '/mobile/settings', label: 'Settings', match: (s: string[]) => s.includes('settings') },
];

const MobileLayout = ({ children }: { children: ReactNode }) => {
  const segments = useSelectedLayoutSegments();

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary flex flex-col safe-top safe-bottom">
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-light-secondary/95 dark:bg-dark-secondary/95 backdrop-blur-lg border-t border-light-200/50 dark:border-dark-200/50 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navLinks.map((link) => {
            const isActive = link.match(segments);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-150',
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-black/50 dark:text-white/50',
                )}
              >
                <link.icon size={22} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
