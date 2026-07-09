import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SettingsButton = () => {
  const router = useRouter();

  return (
    <div
      className="p-2.5 rounded-full bg-light-200 text-black/70 dark:bg-dark-200 dark:text-white/70 hover:opacity-70 hover:scale-105 transition duration-200 cursor-pointer active:scale-95"
      onClick={() => router.push('/settings')}
    >
      <Settings size={19} className="cursor-pointer" />
    </div>
  );
};

export default SettingsButton;
