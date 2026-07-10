import { Check, ClipboardList } from 'lucide-react';
import { Message } from '../ChatWindow';
import { useState } from 'react';
import { Section } from '@/lib/hooks/useChat';
import { SourceBlock } from '@/lib/types';

const Copy = ({
  section,
  initialMessage,
}: {
  section: Section;
  initialMessage: string;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <button
      title="Copy answer with citations"
      onClick={async () => {
        const sources = section.message.responseBlocks.filter(
          (b) => b.type === 'source' && b.data.length > 0,
        ) as SourceBlock[];

        const cleanMessage = initialMessage
          .replace(/<citation[^>]*>(\d+)<\/citation>/g, '[$1]')
          .replace(/<[^>]+>/g, '');

        const contentToCopy = `${cleanMessage}${
          sources.length > 0
            ? `\n\nCitations:\n${sources
                .map((source) => source.data)
                .flat()
                .map(
                  (s, i) =>
                    `[${i + 1}] ${s.metadata.url.startsWith('file_id://') ? s.metadata.fileName || 'Uploaded File' : s.metadata.url}`,
                )
                .join(`\n`)}`
            : ''
        }`;

        try {
          await navigator.clipboard.writeText(contentToCopy);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = contentToCopy;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
      className="p-2 text-black/70 dark:text-white/70 rounded-full hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
    >
      {copied ? <Check size={16} /> : <ClipboardList size={16} />}
    </button>
  );
};

export default Copy;
