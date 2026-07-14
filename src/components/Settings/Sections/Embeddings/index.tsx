'use client';

import { Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface EmbeddingStats {
  chats: {
    total: number;
    embedded: number;
    pending: number;
  };
  messages: {
    total: number;
    embedded: number;
    pending: number;
  };
}

export default function EmbeddingsSection() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/embeddings');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch embedding stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const res = await fetch('/api/embeddings', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        toast.success(
          `Backfill complete! Embedded ${data.data.chats.embedded} chats and ${data.data.messages.embedded} messages.`,
        );
        await fetchStats();
      } else {
        toast.error(data.error || 'Backfill failed');
      }
    } catch (error) {
      toast.error('Failed to start backfill');
    } finally {
      setIsBackfilling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-light-200 dark:bg-dark-200 rounded w-1/4" />
          <div className="h-4 bg-light-200 dark:bg-dark-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-black/90 dark:text-white/90">
          Embedding Status
        </h5>
        <p className="text-xs text-black/50 dark:text-white/50">
          Embeddings are used for semantic search and analytics. New chats and
          messages are automatically embedded.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Database size={16} className="text-black/70 dark:text-white/70" />
              <span className="text-sm font-medium text-black/90 dark:text-white/90">
                Chats
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-black/50 dark:text-white/50">Embedded</span>
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {stats.chats.embedded}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black/50 dark:text-white/50">Pending</span>
                <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  {stats.chats.pending > 0 ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                  {stats.chats.pending}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black/50 dark:text-white/50">Total</span>
                <span className="text-black/70 dark:text-white/70">{stats.chats.total}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-light-200 dark:border-dark-200 p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Database size={16} className="text-black/70 dark:text-white/70" />
              <span className="text-sm font-medium text-black/90 dark:text-white/90">
                Messages
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-black/50 dark:text-white/50">Embedded</span>
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {stats.messages.embedded}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black/50 dark:text-white/50">Pending</span>
                <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  {stats.messages.pending > 0 ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                  {stats.messages.pending}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black/50 dark:text-white/50">Total</span>
                <span className="text-black/70 dark:text-white/70">{stats.messages.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleBackfill}
          disabled={isBackfilling}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBackfilling ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          <span className="text-sm text-black/90 dark:text-white/90">
            {isBackfilling ? 'Backfilling...' : 'Backfill Missing Embeddings'}
          </span>
        </button>
        <p className="text-xs text-black/50 dark:text-white/50">
          Only chats and messages without embeddings will be processed. Safe to
          run multiple times.
        </p>
      </div>
    </div>
  );
}