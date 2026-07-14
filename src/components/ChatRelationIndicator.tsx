'use client';

import { AtSign, GitBranch, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatRelation {
  id: string;
  chatId: string;
  relatedChatId: string;
  relationType: 'fork' | 'reference';
  createdAt: string;
  childChat?: { id: string; title: string };
  parentChat?: { id: string; title: string };
}

const ChatRelationIndicator = ({ chatId }: { chatId: string }) => {
  const [relations, setRelations] = useState<ChatRelation[]>([]);

  useEffect(() => {
    if (!chatId) return;

    fetch(`/api/chats/${chatId}/relations?direction=parents`)
      .then((res) => res.json())
      .then((data) => {
        setRelations(data.relations || []);
      })
      .catch(() => {});
  }, [chatId]);

  if (relations.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {relations.map((rel) => (
        <a
          key={rel.id}
          href={`/c/${rel.relatedChatId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors max-w-[150px]"
          title={`${rel.relationType === 'fork' ? 'Forked from' : 'Referenced'}: ${rel.parentChat?.title || 'Unknown chat'}`}
        >
          {rel.relationType === 'fork' ? (
            <GitBranch size={10} className="shrink-0" />
          ) : (
            <AtSign size={10} className="shrink-0" />
          )}
          <span className="truncate">
            {rel.relationType === 'fork' ? 'Forked' : 'Ref'}: {rel.parentChat?.title || 'Unknown'}
          </span>
          <ExternalLink size={8} className="shrink-0 opacity-50" />
        </a>
      ))}
    </div>
  );
};

export default ChatRelationIndicator;
