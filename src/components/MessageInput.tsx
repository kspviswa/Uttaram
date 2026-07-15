import { cn } from '@/lib/utils';
import { AtSign, ArrowUp, StopCircle, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import AttachSmall from './MessageInputActions/AttachSmall';
import Optimization from './MessageInputActions/Optimization';
import Sources from './MessageInputActions/Sources';
import { useChat } from '@/lib/hooks/useChat';
import ChatReferencePopover from './MessageInputActions/ChatReferencePopover';

const MessageInput = () => {
  const { loading, sendMessage, stop, referenceChat, setReferenceChat, chatId } = useChat();
  const [message, setMessage] = useState('');
  const [textareaRows, setTextareaRows] = useState(1);
  const [mode, setMode] = useState<'multi' | 'single'>('single');
  const [showReferencePopover, setShowReferencePopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (textareaRows >= 2 && message && mode === 'single') {
      setMode('multi');
    } else if (!message && mode === 'multi') {
      setMode('single');
    }
  }, [textareaRows, mode, message]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const detectAtSymbol = useCallback((value: string, cursorPos: number) => {
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastChar = textBeforeCursor[cursorPos - 1];
    const charBeforeLast = cursorPos >= 2 ? textBeforeCursor[cursorPos - 2] : ' ';

    if (lastChar === '@' && (charBeforeLast === ' ' || charBeforeLast === '\n' || cursorPos === 1)) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPopoverPosition({
          top: -280,
          left: 0,
        });
      }
      setShowReferencePopover(true);
    } else {
      const atMatch = textBeforeCursor.match(/@(\S*)$/);
      if (!atMatch) {
        setShowReferencePopover(false);
      }
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMessage(newValue);
    detectAtSymbol(newValue, cursorPos);
  }, [detectAtSymbol]);

  const handleReferenceSelect = useCallback((chat: { id: string; title: string; preview: string; createdAt: string; projectId: string | null }) => {
    setReferenceChat(chat);
    setShowReferencePopover(false);

    const cursorPos = inputRef.current?.selectionStart || message.length;
    const textBeforeCursor = message.substring(0, cursorPos);
    const textAfterCursor = message.substring(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.substring(0, atIndex) + textAfterCursor;
    setMessage(newText);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [message, setReferenceChat]);

  const handleClearReference = useCallback(() => {
    setReferenceChat(null);
    inputRef.current?.focus();
  }, [setReferenceChat]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <form
      onSubmit={(e) => {
        if (loading) return;
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      className={cn(
        'relative bg-light-secondary dark:bg-dark-secondary flex items-center overflow-visible border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/20 transition-all duration-200 focus-within:border-light-300 dark:focus-within:border-dark-300',
        mode === 'multi' ? 'flex-col rounded-2xl p-4' : 'flex-row rounded-full p-4',
      )}
    >
      <div ref={containerRef} className={cn('relative', mode === 'multi' ? 'w-full' : 'flex-1')}>
        <ChatReferencePopover
          isOpen={showReferencePopover}
          onClose={() => setShowReferencePopover(false)}
          onSelect={handleReferenceSelect}
          projectId={null}
          currentChatId={chatId}
          position={popoverPosition}
        />

        {referenceChat && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
            <AtSign size={12} className="text-sky-500 shrink-0" />
            <span className="text-xs text-sky-600 dark:text-sky-400 truncate flex-1">
              Referencing: {referenceChat.title}
            </span>
            <button
              type="button"
              onClick={handleClearReference}
              className="text-sky-500/50 hover:text-sky-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className={cn('flex items-center gap-2', mode === 'multi' ? 'w-full' : '')}>
          <button
            type="button"
            onClick={() => setShowReferencePopover(true)}
            className="p-1.5 rounded-lg text-black/40 dark:text-white/40 hover:text-sky-500 hover:bg-light-200 hover:dark:bg-dark-200 transition-colors shrink-0"
            title="Reference a chat (@)"
          >
            <AtSign size={16} />
          </button>
          <TextareaAutosize
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onHeightChange={(height, props) => {
              setTextareaRows(Math.ceil(height / props.rowHeight));
            }}
            className="transition bg-transparent dark:placeholder:text-white/50 placeholder:text-sm text-sm dark:text-white resize-none focus:outline-none w-full px-2 max-h-24 lg:max-h-36 xl:max-h-48 flex-grow flex-shrink !text-left"
            placeholder="Ask a follow-up (use @ to reference)"
          />
        </div>
      </div>

      {mode === 'single' && (
        <>
          <Sources />
          <Optimization />
          <button
            disabled={!loading && message.trim().length === 0}
            onClick={loading ? stop : undefined}
            className={`rounded-full p-2 transition duration-100 ${
              loading
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#24A0ED] text-white disabled:text-black/50 dark:disabled:text-white/50 hover:bg-opacity-85 disabled:bg-[#e0e0dc79] dark:disabled:bg-[#ececec21]'
            }`}
          >
            {loading ? <StopCircle className="bg-background" size={17} /> : <ArrowUp className="bg-background" size={17} />}
          </button>
        </>
      )}
      {mode === 'multi' && (
        <div className="flex flex-row items-center justify-between w-full pt-2">
          <div className="flex flex-row items-center space-x-1">
            <AttachSmall />
            <Sources />
            <Optimization />
          </div>
          <button
            disabled={!loading && message.trim().length === 0}
            onClick={loading ? stop : undefined}
            className={`rounded-full p-2 transition duration-100 ${
              loading
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#24A0ED] text-white disabled:text-black/50 dark:disabled:text-white/50 hover:bg-opacity-85 disabled:bg-[#e0e0dc79] dark:disabled:bg-[#ececec21]'
            }`}
          >
            {loading ? <StopCircle className="bg-background" size={17} /> : <ArrowUp className="bg-background" size={17} />}
          </button>
        </div>
      )}
    </form>
  );
};

export default MessageInput;
