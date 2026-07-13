// ============================================
// Call Logs Page — Admin Dashboard
// ============================================
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  Phone, Clock, User, Calendar, Search, Filter, 
  ChevronLeft, ChevronRight, FileText, CalendarClock 
} from 'lucide-react';
import callService from '@/services/call.service';

const CALL_OUTCOME_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  connected: { label: 'Connected', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  interested: { label: 'Interested', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  not_interested: { label: 'Not Interested', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  callback: { label: 'Callback', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  no_answer: { label: 'No Answer', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  busy: { label: 'Busy Line', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  voicemail: { label: 'Voicemail', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  converted: { label: 'Converted', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  wrong_number: { label: 'Wrong Number', color: '#71717A', bg: 'rgba(113, 113, 122, 0.12)' },
};

export default function AdminCallsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['call-logs', page, limit, search, outcomeFilter],
    queryFn: () => 
      callService.getCallLogs({
        page,
        limit,
        search: search || undefined,
        outcome: outcomeFilter || undefined,
      }),
  });

  const calls = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Call History</h1>
        <p className="text-xs text-zinc-500 mt-1">Review and track all dialer call activities across the platform</p>
      </div>

      {/* Search & Filter Bar */}
      <div 
        className="p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-center justify-between"
        style={{ background: '#141418', borderColor: '#1E1E22' }}
      >
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Lead or Agent..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pr-4 py-2 text-xs"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto items-center">
          <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="input-field py-2 text-xs"
            style={{ minWidth: '150px' }}
          >
            <option value="">All Outcomes</option>
            {Object.entries(CALL_OUTCOME_CONFIG).map(([val, config]) => (
              <option key={val} value={val}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 rounded-xl bg-zinc-800/30 animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800/20 animate-pulse" />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <Phone className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No call logs found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria or start logging calls from lead detail pages.
          </p>
        </div>
      ) : (
        <div 
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60 text-zinc-500 font-bold uppercase tracking-wider" style={{ background: '#111115' }}>
                  <th className="p-4">Lead</th>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Outcome</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Follow-Up Date</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {calls.map((call: any, index: number) => {
                  const lead = call.lead;
                  const agent = call.agent;
                  const outcomeConfig = CALL_OUTCOME_CONFIG[call.outcome] || { label: call.outcome, color: '#A1A1AA', bg: 'rgba(161, 161, 170, 0.08)' };

                  return (
                    <motion.tr
                      key={call._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-zinc-800/10 transition-colors"
                    >
                      <td className="p-4">
                        {lead ? (
                          <Link 
                            href={`/admin/leads/${lead._id}`}
                            className="font-bold text-white hover:text-blue-400 hover:underline transition-colors block"
                          >
                            {lead.fullName}
                          </Link>
                        ) : (
                          <span className="text-zinc-500 font-medium">Deleted Lead</span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{lead?.phone || '—'}</span>
                      </td>
                      <td className="p-4 font-medium text-zinc-300">
                        {agent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              {agent.firstName[0]}
                            </div>
                            <span>{agent.firstName} {agent.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">System</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: outcomeConfig.color, background: outcomeConfig.bg }}
                        >
                          {outcomeConfig.label}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formatDuration(call.duration)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 font-mono">
                        {call.nextFollowUp ? (
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5 text-orange-400" />
                            <span>{format(new Date(call.nextFollowUp), 'MMM d, yyyy')}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-650">—</span>
                        )}
                      </td>
                      <td className="p-4 max-w-[200px] text-zinc-400 truncate" title={call.notes}>
                        {call.notes ? (
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <span className="truncate">{call.notes}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-650 italic">No notes</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                          <span>{format(new Date(call.startTime), 'MMM d, h:mm a')}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-zinc-800/60 flex items-center justify-between text-zinc-400 text-xs">
              <div>
                Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="text-white font-medium">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="text-white font-medium">{pagination.total}</span> logs
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-white">Page {page} of {pagination.totalPages}</span>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
