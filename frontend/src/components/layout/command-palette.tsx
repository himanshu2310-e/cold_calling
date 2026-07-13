// ============================================
// Global Search Command Palette (Ctrl+K)
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { Search, Loader, Users, PhoneCall, Calendar, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import leadService from '@/services/lead.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ILead } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ILead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await leadService.getLeads({ search: query, limit: 5 });
        setResults(res.data.leads || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  // Navigate on select
  const handleSelect = (leadId: string) => {
    onClose();
    router.push(isAdmin ? `/admin/leads/${leadId}` : `/agent/leads/${leadId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0B0B0F]/70 backdrop-blur-md"
          />

          {/* Search container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[50vh] animate-fade-in"
            style={{
              background: '#171717',
              borderColor: '#27272A',
            }}
          >
            {/* Input Row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#27272A] relative">
              <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search leads, calls, settings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none border-none placeholder-zinc-500"
              />
              {loading && <Loader className="w-4 h-4 animate-spin text-blue-500" />}
            </div>

            {/* Suggestions list */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {results.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 px-3 uppercase block mb-1.5">Leads Matches</span>
                  {results.map((lead) => (
                    <button
                      key={lead._id}
                      onClick={() => handleSelect(lead._id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center font-bold text-xs text-blue-400">
                          {lead.fullName[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{lead.fullName}</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">{lead.company || 'Private Lead'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No records match your query. Try searching for names or phones.
                </div>
              ) : (
                <div className="p-2 space-y-3.5">
                  <span className="text-[10px] font-bold text-zinc-500 px-1 uppercase block">Quick Shortcuts</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => { onClose(); router.push(isAdmin ? '/admin/leads' : '/agent/leads'); }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-[#27272A] bg-[#141418] hover:bg-zinc-800 text-zinc-300 text-left transition-colors"
                    >
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>All Leads List</span>
                    </button>
                    <button
                      onClick={() => { onClose(); router.push(isAdmin ? '/admin/calendar' : '/agent/calendar'); }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-[#27272A] bg-[#141418] hover:bg-zinc-800 text-zinc-300 text-left transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>Calendar Schedulers</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer status bar */}
            <div className="px-4 py-2 bg-[#121216] border-t border-[#27272A] text-[10px] text-zinc-600 flex justify-between items-center font-mono">
              <span>Use Up/Down keys to navigate results</span>
              <span>ESC to exit search</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
