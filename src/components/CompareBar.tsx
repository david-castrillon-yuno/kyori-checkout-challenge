import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';

interface CompareBarProps {
  selectedCount: number;
  onOpen: () => void;
  onClear: () => void;
}

export function CompareBar({ selectedCount, onOpen, onClear }: CompareBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-900 text-white"
        >
          <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4 md:px-6">
            <span className="text-sm text-slate-300">
              {selectedCount} method{selectedCount > 1 ? 's' : ''} selected for
              comparison
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={onClear}
              >
                Clear
              </Button>
              <Button
                variant="default"
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={onOpen}
                disabled={selectedCount < 2}
              >
                View comparison &rarr;
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
