import { ArrowRight, AtSign, StopCircle, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Sources from './MessageInputActions/Sources';
import Optimization from './MessageInputActions/Optimization';
import Attach from './MessageInputActions/Attach';
import { useChat } from '@/lib/hooks/useChat';
import ModelSelector from './MessageInputActions/ChatModelSelector';
import ChatReferencePopover from './MessageInputActions/ChatReferencePopover';

const EmptyChatMessageInput = () => {
  const { sendMessage, loading, stop, referenceChat, setReferenceChat } = useChat();

  const [message, setMessage] = useState('');
  const [showReferencePopover, setShowReferencePopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

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

    inputRef.current?.focus();

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
      className="w-full"
    >
      <div ref={containerRef} className="relative flex flex-col bg-light-secondary dark:bg-dark-secondary px-3 pt-5 pb-3 rounded-2xl w-full border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/20 transition-all duration-200 focus-within:border-light-300 dark:focus-within:border-dark-300">
        <ChatReferencePopover
          isOpen={showReferencePopover}
          onClose={() => setShowReferencePopover(false)}
          onSelect={handleReferenceSelect}
          projectId={null}
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

        <div className="flex items-center gap-2">
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
            minRows={2}
            disabled={loading}
            className="px-2 bg-transparent placeholder:text-[15px] placeholder:text-black/50 dark:placeholder:text-white/50 text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48 disabled:opacity-50"
            placeholder={loading ? 'Generating response...' : 'Ask anything... (use @ to reference a chat)'}
          />
        </div>
        <div className="flex flex-row items-center justify-between mt-4">
          <Optimization />
          <div className="flex flex-row items-center space-x-2">
            <div className="flex flex-row items-center space-x-1">
              <Sources />
              <ModelSelector />
              <Attach />
            </div>
            <button
              type="button"
              disabled={!loading && message.trim().length === 0}
              onClick={loading ? stop : () => { sendMessage(message); setMessage(''); }}
              className={`rounded-full p-2 transition duration-100 ${
                loading
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-sky-500 text-white disabled:text-black/50 dark:disabled:text-white/50 disabled:bg-[#e0e0dc] dark:disabled:bg-[#ececec21] hover:bg-opacity-85'
              }`}
            >
              {loading ? <StopCircle className="bg-background" size={17} /> : <ArrowRight className="bg-background" size={17} />}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EmptyChatMessageInput;
