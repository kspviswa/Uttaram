import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ऊttaram - Personal Curiosity Engine',
  description: 'Curiosity should be personal',
};

const Home = () => {
  return <ChatWindow />;
};

export default Home;
