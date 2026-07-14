'use client';

import { AtSign, Loader2, MessageSquare, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface ChatReference {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  projectId: string | null;
}

interface ChatReferencePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (chat: ChatReference) => void;
  projectId: string | null;
  currentChatId?: string;
  position?: { top: number; left: number };
}

const ChatReferencePopover = ({
  isOpen,
  onClose,
  onSelect,
  projectId,
  currentChatId,
  position,
}: ChatReferencePopoverProps) => {
  const [chats, setChats] = useState<ChatReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (projectId) params.set('projectId', projectId);
      if (currentChatId) params.set('excludeChatId', currentChatId);

      const res = await fetch(`/api/chats/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, projectId, currentChatId]);

  useEffect(() => {
    if (isOpen) {
      fetchChats();
      setSelectedIndex(0);
      setSearchQuery('');
    }
  }, [isOpen, fetchChats]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isOpen) {
        fetchChats();
      }
    }, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isOpen, fetchChats]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, chats.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (chats[selectedIndex]) {
          onSelect(chats[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chats, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute z-50 w-[340px] bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 rounded-xl shadow-lg overflow-hidden"
          style={position ? { top: position.top, left: position.left } : { bottom: '100%', left: 0, marginBottom: 8 }}
        >
          <div className="p-2 border-b border-light-200 dark:border-dark-200">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search chats to reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-light-secondary dark:bg-dark-secondary rounded-lg text-xs text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none border border-transparent transition duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  className="animate-spin text-black/40 dark:text-white/40"
                  size={20}
                />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare
                  size={24}
                  className="mx-auto mb-2 text-black/30 dark:text-white/30"
                />
                <p className="text-xs text-black/50 dark:text-white/50">
                  {searchQuery
                    ? 'No chats found'
                    : 'No chats to reference yet'}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {chats.map((chat, index) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelect(chat)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-3 py-2.5 flex items-start gap-3 text-left transition duration-150 ${
                      index === selectedIndex
                        ? 'bg-light-secondary dark:bg-dark-secondary'
                        : 'hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50'
                    }`}
                  >
                    <AtSign
                      size={14}
                      className={`mt-0.5 shrink-0 ${
                        index === selectedIndex
                          ? 'text-sky-500'
                          : 'text-black/40 dark:text-white/40'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate ${
                          index === selectedIndex
                            ? 'text-sky-500'
                            : 'text-black dark:text-white'
                        }`}
                      >
                        {chat.title}
                      </p>
                      {chat.preview && (
                        <p className="text-[11px] text-black/50 dark:text-white/50 truncate mt-0.5">
                          {chat.preview}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-light-200 dark:border-dark-200 bg-light-secondary/50 dark:bg-dark-secondary/50">
            <p className="text-[10px] text-black/40 dark:text-white/40 text-center">
              Select a chat to reference its context
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatReferencePopover;
