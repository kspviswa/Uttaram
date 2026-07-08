'use client';

import { useState } from 'react';
import { GitBranch, Loader2 } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';

const Fork = ({ sectionIndex }: { sectionIndex: number }) => {
  const [loading, setLoading] = useState(false);
  const { messages, chatId } = useChat();

  const handleFork = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const messagesUpToSection = messages.slice(0, sectionIndex + 1);

      const chatModelKey = localStorage.getItem('chatModelKey');
      const chatModelProviderId = localStorage.getItem('chatModelProviderId');

      const res = await fetch('/api/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesUpToSection,
          chatId,
          title: messagesUpToSection[0]?.query || 'Forked Chat',
          chatModel: {
            providerId: chatModelProviderId,
            key: chatModelKey,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Fork failed:', err);
        return;
      }

      const data = await res.json();
      window.location.href = `/c/${data.chatId}`;
    } catch (err) {
      console.error('Failed to fork thread:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFork}
      disabled={loading}
      className="p-2 text-black/70 dark:text-white/70 rounded-full hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
      title="Fork thread into new chat"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <GitBranch size={16} />
      )}
    </button>
  );
};

export default Fork;
