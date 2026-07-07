import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ऊttaram - Direct your curiosity',
  description: 'ऊttaram is an AI powered answering engine.',
};

const Home = () => {
  return <ChatWindow />;
};

export default Home;
