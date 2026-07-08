'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { Block } from '@/lib/types';
import { Message } from '../ChatWindow';

const Summarize = ({ sectionIndex }: { sectionIndex: number }) => {
  const [loading, setLoading] = useState(false);
  const { messages, chatId, setMessages, chatHistory } = useChat();

  const handleSummarize = async () => {
    if (loading) return;
    setLoading(true);

    const historyUpToSection = chatHistory.slice(0, (sectionIndex + 1) * 2);

    const chatModelKey = localStorage.getItem('chatModelKey');
    const chatModelProviderId = localStorage.getItem('chatModelProviderId');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: historyUpToSection,
          chatModel: {
            providerId: chatModelProviderId,
            key: chatModelKey,
          },
        }),
      });

      if (!res.ok) {
        console.error('Summarize failed:', await res.json());
        return;
      }

      const data = await res.json();
      const summary = data.summary;

      const messageId = crypto.randomUUID();
      const textBlock: Block & { type: 'text' } = {
        id: crypto.randomUUID(),
        type: 'text',
        data: `## Summary\n\n${summary}`,
      };

      const newMessage: Message = {
        chatId: chatId || '',
        messageId,
        createdAt: new Date(),
        backendId: crypto.randomUUID(),
        query: 'Conversation Summary',
        responseBlocks: [textBlock],
        status: 'completed',
        phase: 'writing',
      };

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          messageId,
          backendId: newMessage.backendId,
          query: newMessage.query,
          responseBlocks: newMessage.responseBlocks,
        }),
      });

      setMessages([...messages, newMessage]);
    } catch (err) {
      console.error('Failed to summarize:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSummarize}
      disabled={loading}
      className="p-2 text-black/70 dark:text-white/70 rounded-full hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
      title="Summarize conversation"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
    </button>
  );
};

export default Summarize;
