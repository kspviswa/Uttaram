import { useChat } from '@/lib/hooks/useChat';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Switch,
  Dialog,
  DialogPanel,
  Transition,
} from '@headlessui/react';
import {
  GlobeIcon,
  GraduationCapIcon,
  NetworkIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useState } from 'react';

const sourcesList = [
  {
    name: 'Web',
    key: 'web',
    icon: <GlobeIcon className="h-[16px] w-auto" />,
  },
  {
    name: 'Academic',
    key: 'academic',
    icon: <GraduationCapIcon className="h-[16px] w-auto" />,
  },
  {
    name: 'Social',
    key: 'discussions',
    icon: <NetworkIcon className="h-[16px] w-auto" />,
  },
];

const Sources = () => {
  const { sources, setSources } = useChat();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSource = (key: string) => {
    if (!sources.includes(key)) {
      setSources([...sources, key]);
    } else {
      setSources(sources.filter((s) => s !== key));
    }
  };

  return (
    <>
      {/* Desktop popover */}
      <Popover className="relative hidden md:block">
        {({ open }) => (
          <>
            <PopoverButton className="flex items-center justify-center active:border-none hover:bg-light-200 hover:dark:bg-dark-200 p-2 rounded-lg focus:outline-none text-black/50 dark:text-white/50 active:scale-95 transition duration-200 hover:text-black dark:hover:text-white">
              <GlobeIcon className="h-[18px] w-auto" />
            </PopoverButton>
            <AnimatePresence>
              {open && (
                <PopoverPanel
                  static
                  className="absolute z-10 w-64 md:w-[225px] right-0"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    className="origin-top-right flex flex-col bg-light-primary dark:bg-dark-primary border rounded-lg border-light-200 dark:border-dark-200 w-full p-1 max-h-[200px] md:max-h-none overflow-y-auto shadow-lg"
                  >
                    {sourcesList.map((source, i) => (
                      <div
                        key={i}
                        className="flex flex-row justify-between hover:bg-light-100 hover:dark:bg-dark-100 rounded-md py-3 px-2 cursor-pointer"
                        onClick={() => toggleSource(source.key)}
                      >
                        <div className="flex flex-row space-x-1.5 text-black/80 dark:text-white/80">
                          {source.icon}
                          <p className="text-xs">{source.name}</p>
                        </div>
                        <Switch
                          checked={sources.includes(source.key)}
                          className="group relative flex h-4 w-7 shrink-0 cursor-pointer rounded-full bg-light-200 dark:bg-white/10 p-0.5 duration-200 ease-in-out focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed data-[checked]:bg-sky-500 dark:data-[checked]:bg-sky-500"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none inline-block size-3 translate-x-[1px] group-data-[checked]:translate-x-3 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                          />
                        </Switch>
                      </div>
                    ))}
                  </motion.div>
                </PopoverPanel>
              )}
            </AnimatePresence>
          </>
        )}
      </Popover>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex md:hidden items-center justify-center active:border-none hover:bg-light-200 hover:dark:bg-dark-200 p-2 rounded-lg focus:outline-none text-black/50 dark:text-white/50 active:scale-95 transition duration-200 hover:text-black dark:hover:text-white"
      >
        <GlobeIcon className="h-[18px] w-auto" />
      </button>

      {/* Mobile bottom sheet */}
      <Transition appear show={mobileOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 md:hidden"
          onClose={() => setMobileOpen(false)}
        >
          <div className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex items-end justify-center">
            <DialogPanel className="w-full max-w-md rounded-t-2xl bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 p-4 pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-black/70 dark:text-white/70">
                  Search Sources
                </p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col space-y-1">
                {sourcesList.map((source, i) => (
                  <div
                    key={i}
                    className="flex flex-row justify-between hover:bg-light-100 hover:dark:bg-dark-100 rounded-md py-3 px-2 cursor-pointer"
                    onClick={() => toggleSource(source.key)}
                  >
                    <div className="flex flex-row space-x-1.5 text-black/80 dark:text-white/80">
                      {source.icon}
                      <p className="text-sm font-medium">{source.name}</p>
                    </div>
                    <Switch
                      checked={sources.includes(source.key)}
                      className="group relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full bg-light-200 dark:bg-white/10 p-0.5 duration-200 ease-in-out focus:outline-none transition-colors data-[checked]:bg-sky-500 dark:data-[checked]:bg-sky-500"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none inline-block size-4 translate-x-[1px] group-data-[checked]:translate-x-4 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                      />
                    </Switch>
                  </div>
                ))}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Sources;
