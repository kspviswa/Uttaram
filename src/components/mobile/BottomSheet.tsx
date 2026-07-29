'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const MobileBottomSheet = ({ open, onClose, title, children }: BottomSheetProps) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-end justify-center">
          <DialogPanel className="w-full max-w-md rounded-t-2xl bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 p-4 pt-6 shadow-xl">
            {title && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-black/70 dark:text-white/70">
                  {title}
                </p>
                <button
                  onClick={onClose}
                  className="p-1 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {children}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MobileBottomSheet;
