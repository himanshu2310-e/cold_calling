// ============================================
// Keyboard Shortcuts Guide Dialogue
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on '?' key click
      if (e.key === '?' && e.target instanceof HTMLInputElement === false && e.target instanceof HTMLTextAreaElement === false) {
        setIsOpen((prev) => !prev);
      }
      // Close on 'Escape'
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating help hook */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-9 h-9 rounded-full border border-zinc-800 bg-[#171717] hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 flex items-center justify-center transition-colors shadow-2xl cursor-pointer"
        title="Keyboard Shortcuts Guide"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-[#0B0B0F]/70 backdrop-blur-sm"
            />

            {/* Guide overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl border p-6 space-y-4"
              style={{ background: '#171717', borderColor: '#27272A' }}
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Keyboard Hotkeys</span>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcut lists */}
              <div className="space-y-3.5 text-xs text-zinc-300 font-sans">
                <div className="flex justify-between items-center">
                  <span>Global Command Palette</span>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Toggle Hotkey Guide</span>
                  <kbd className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    ?
                  </kbd>
                </div>

                <div className="flex justify-between items-center">
                  <span>Go to Calendar</span>
                  <kbd className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    C
                  </kbd>
                </div>

                <div className="flex justify-between items-center">
                  <span>Go to Kanban Board</span>
                  <kbd className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    K
                  </kbd>
                </div>

                <div className="flex justify-between items-center">
                  <span>Go to Leads List</span>
                  <kbd className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    L
                  </kbd>
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 text-center pt-2">
                Press ESC to close this window
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
