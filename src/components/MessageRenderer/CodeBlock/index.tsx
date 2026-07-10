'use client';

import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import SyntaxHighlighter from 'react-syntax-highlighter';
import darkTheme from './CodeBlockDarkTheme';
import lightTheme from './CodeBlockLightTheme';

const SyntaxHighlighterComponent =
  SyntaxHighlighter as unknown as React.ComponentType<any>;

const CodeBlock = ({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const syntaxTheme = useMemo(() => {
    if (!mounted) return lightTheme;
    return resolvedTheme === 'dark' ? darkTheme : lightTheme;
  }, [mounted, resolvedTheme]);

  return (
    <div className="relative group">
      <button
        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/20 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        title="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children as string);
          } catch {
            const ta = document.createElement('textarea');
            ta.value = children as string;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? (
          <CheckIcon
            size={16}
            className="text-white/90"
          />
        ) : (
          <CopyIcon
            size={16}
            className="text-white/70 hover:text-white transition-colors duration-200"
          />
        )}
      </button>
      {language && (
        <span className="absolute top-2 left-3 text-[10px] text-white/40 font-mono uppercase tracking-wider select-none">
          {language}
        </span>
      )}
      <SyntaxHighlighterComponent
        language={language}
        style={syntaxTheme}
        showInlineLineNumbers
        customStyle={{ paddingTop: language ? '2rem' : undefined }}
      >
        {children as string}
      </SyntaxHighlighterComponent>
    </div>
  );
};

export default CodeBlock;
