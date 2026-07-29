'use client';

import Chat from '@/components/Chat';
import Navbar from '@/components/Navbar';
import Loader from '@/components/ui/Loader';
import { useChat } from '@/lib/hooks/useChat';

const MobileChatPage = () => {
  const { isReady } = useChat();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar />
      <div className="flex-1 px-4">
        <Chat />
      </div>
    </div>
  );
};

export default MobileChatPage;
