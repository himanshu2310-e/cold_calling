// Agent Leads Page — uses same lead service but filtered to agent's leads
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Plus, Filter, Eye, Edit, Star, Target, ChevronLeft, ChevronRight, Square, CheckSquare, X } from 'lucide-react';
import leadService from '@/services/lead.service';
import { useAuthStore } from '@/stores/auth.store';
import { LEAD_STATUS_CONFIG, LEAD_PRIORITY_CONFIG } from '@/constants';
import type { ILead } from '@/types';
import LeadDialog from '@/components/leads/lead-dialog';

function StatusBadge({ status }: { status: string }) {
  const config = LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG] || { label: status, color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)' };
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color, background: config.bg }}>{config.label}</span>;
}

export default function AgentLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ILead | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') { setLeadDialogOpen(true); setEditingLead(null); }
  }, [searchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agent-leads', search, statusFilter, page],
    queryFn: () => leadService.getLeads({ search: search || undefined, status: statusFilter || undefined, page, limit: 20 }),
  });

  const leads: ILead[] = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Leads</h1>
          <p className="text-xs text-zinc-500 mt-1">Leads assigned to you</p>
        </div>
        <button onClick={() => { setEditingLead(null); setLeadDialogOpen(true); }} className="btn-primary flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-3.5 h-3.5" /><span>Add Lead</span>
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Search leads..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field" style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto min-w-[140px]">
          <option value="">All Statuses</option>
          {Object.entries(LEAD_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#141418', borderColor: '#1E1E22' }}>
        {isLoading ? (
          <div className="p-8 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-zinc-800/30 animate-pulse" />)}</div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No leads found</h3>
            <p className="text-xs text-zinc-500">Add your first lead to start tracking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold flex-shrink-0">{lead.fullName[0]}</div>
                        <div className="min-w-0">
                          <button onClick={() => router.push(`/agent/leads/${lead._id}`)} className="text-xs font-semibold text-white hover:text-blue-400 transition-colors cursor-pointer truncate block">{lead.fullName}</button>
                          <p className="text-[10px] text-zinc-500 truncate">{lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-zinc-400">{lead.company || '—'}</td>
                    <td className="p-3"><StatusBadge status={lead.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => router.push(`/agent/leads/${lead._id}`)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditingLead(lead); setLeadDialogOpen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <LeadDialog lead={editingLead} isOpen={leadDialogOpen} onClose={() => { setLeadDialogOpen(false); setEditingLead(null); }} onSuccess={() => refetch()} isAdmin={false} currentUserId={user?._id || ''} />
    </div>
  );
}
