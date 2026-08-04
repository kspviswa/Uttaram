import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ऊttaram - Personal Curiosity Engine',
  description: 'Chat with the internet, chat with ऊttaram.',
};

const Home = () => {
  return <ChatWindow />;
};

export default Home;
