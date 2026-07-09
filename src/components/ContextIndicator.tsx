import { useState, useEffect, useMemo } from 'react';
import { useChat } from '@/lib/hooks/useChat';

const approximateTokens = (text: string) => Math.ceil(text.length / 4);

const ContextIndicator = () => {
  const { sections } = useChat();
  const [contextLength, setContextLength] = useState(8192);
  const [systemInstructions, setSystemInstructions] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState('');

  const readProfile = () => {
    const stored = localStorage.getItem('contextLength');
    if (stored) setContextLength(parseInt(stored, 10));
    setSystemInstructions(localStorage.getItem('systemInstructions') || '');
    setAboutMe(localStorage.getItem('aboutMe') || '');
    setUserName(localStorage.getItem('userName') || '');
    setLocation(localStorage.getItem('location') || '');
  };

  useEffect(() => {
    readProfile();
    const handler = () => readProfile();
    window.addEventListener('client-config-changed', handler);
    return () => window.removeEventListener('client-config-changed', handler);
  }, []);

  const totalTokens = useMemo(() => {
    const lastWithUsage = [...sections]
      .reverse()
      .find((s) => s.message.usage?.promptTokens);

    if (lastWithUsage) {
      return lastWithUsage.message.usage!.promptTokens;
    }

    let total = 0;
    for (const section of sections) {
      total += approximateTokens(section.message.query);
      for (const block of section.message.responseBlocks) {
        if (block.type === 'text') {
          total += approximateTokens(block.data);
        }
      }
    }

    const profileParts: string[] = [];
    if (userName) profileParts.push(`Name: ${userName}`);
    if (location) profileParts.push(`Location: ${location}`);
    if (aboutMe) profileParts.push(`About: ${aboutMe}`);
    const profileText = profileParts.join('\n');
    if (profileText) total += approximateTokens(profileText);

    if (systemInstructions) total += approximateTokens(systemInstructions);

    return total;
  }, [sections, systemInstructions, aboutMe, userName, location]);

  const percent = contextLength > 0 ? (totalTokens / contextLength) * 100 : 0;

  if (sections.length === 0) return null;

  const color =
    percent >= 95
      ? 'bg-red-500'
      : percent >= 80
        ? 'bg-amber-500'
        : percent >= 60
          ? 'bg-yellow-500'
          : 'bg-emerald-500';

  const textColor =
    percent >= 80
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-black/50 dark:text-white/50';

  return (
    <div className="flex items-center gap-2 mt-1" title={`${totalTokens.toLocaleString()} / ${contextLength.toLocaleString()} tokens used`}>
      <div className="w-20 h-1.5 rounded-full bg-light-200 dark:bg-dark-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium tabular-nums ${textColor}`}>
        {percent >= 80 ? '!' : ''}{Math.round(percent)}%
      </span>
    </div>
  );
};

export default ContextIndicator;
