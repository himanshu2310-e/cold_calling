// ============================================
// Admin Leads Page — CRM Table + Filters
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, Filter, Download, Upload, Trash2,
  ChevronLeft, ChevronRight, Star, Pin,
  MoreHorizontal, Eye, Edit, Phone, CheckSquare,
  Square, ArrowUpDown, Target, Users, X,
} from 'lucide-react';
import leadService from '@/services/lead.service';
import { useAuthStore } from '@/stores/auth.store';
import { LEAD_STATUS_CONFIG, LEAD_PRIORITY_CONFIG } from '@/constants';
import type { ILead, IUser } from '@/types';
import LeadDialog from '@/components/leads/lead-dialog';
import CSVImportDialog from '@/components/leads/csv-import-dialog';

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config = LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG] || {
    label: status,
    color: '#A1A1AA',
    bg: 'rgba(161,161,170,0.12)',
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = LEAD_PRIORITY_CONFIG[priority as keyof typeof LEAD_PRIORITY_CONFIG] || {
    label: priority,
    color: '#A1A1AA',
    bg: 'rgba(161,161,170,0.12)',
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Dialogs
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ILead | null>(null);
  const [csvDialogOpen, setCSVDialogOpen] = useState(false);

  // Check for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setLeadDialogOpen(true);
      setEditingLead(null);
    }
  }, [searchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', search, statusFilter, priorityFilter, page],
    queryFn: () =>
      leadService.getLeads({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit: 20,
      }),
  });

  const leads: ILead[] = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalLeads = data?.pagination?.total || 0;

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} lead(s)?`)) return;
    try {
      await leadService.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} lead(s) deleted`);
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error('Failed to delete leads');
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await leadService.exportLeadsCSV({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-export-${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await leadService.toggleFavorite(id);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch {}
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const hasActiveFilters = !!search || !!statusFilter || !!priorityFilter;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {totalLeads} total lead{totalLeads !== 1 ? 's' : ''} in your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCSVDialogOpen(true)} className="btn-secondary flex items-center gap-1.5 text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1.5 text-xs cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => { setEditingLead(null); setLeadDialogOpen(true); }}
            className="btn-primary flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, phone, email, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-1.5 cursor-pointer ${showFilters ? 'border-blue-500 text-blue-400' : ''}`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap items-center gap-3 p-4 rounded-xl border"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {Object.entries(LEAD_STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Priorities</option>
            {Object.entries(LEAD_PRIORITY_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer">
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </motion.div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl border"
          style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.15)' }}
        >
          <span className="text-xs font-semibold text-blue-400">
            {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkDelete} className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: '#141418', borderColor: '#1E1E22' }}
      >
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-zinc-800/30 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No leads found</h3>
            <p className="text-xs text-zinc-500 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Get started by adding your first lead.'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => { setEditingLead(null); setLeadDialogOpen(true); }}
                className="btn-primary cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add First Lead
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 w-10">
                    <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                      {selectedIds.length === leads.length && leads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Priority</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Source</th>
                  <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Agent</th>
                  <th className="text-right p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead._id);
                  const agent = typeof lead.assignedTo === 'object' ? lead.assignedTo : null;
                  return (
                    <tr
                      key={lead._id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group"
                    >
                      <td className="p-3">
                        <button onClick={() => toggleSelect(lead._id)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold flex-shrink-0">
                            {lead.fullName[0]}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => router.push(`/admin/leads/${lead._id}`)}
                              className="text-xs font-semibold text-white hover:text-blue-400 transition-colors cursor-pointer truncate block"
                            >
                              {lead.fullName}
                            </button>
                            <p className="text-[10px] text-zinc-500 truncate">{lead.phone}</p>
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(lead._id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Star
                              className="w-3.5 h-3.5"
                              style={{
                                color: lead.isFavorite ? '#F59E0B' : '#52525B',
                                fill: lead.isFavorite ? '#F59E0B' : 'none',
                              }}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-zinc-400 truncate block max-w-[140px]">
                          {lead.company || '—'}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-zinc-500 text-[11px]">{lead.leadSource || '—'}</span>
                      </td>
                      <td className="p-3 hidden xl:table-cell">
                        <span className="text-zinc-400 text-[11px]">
                          {agent ? `${agent.firstName} ${agent.lastName}` : '—'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/admin/leads/${lead._id}`)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingLead(lead); setLeadDialogOpen(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <LeadDialog
        lead={editingLead}
        isOpen={leadDialogOpen}
        onClose={() => { setLeadDialogOpen(false); setEditingLead(null); }}
        onSuccess={() => refetch()}
        isAdmin={true}
        currentUserId={user?._id || ''}
      />
      <CSVImportDialog
        isOpen={csvDialogOpen}
        onClose={() => setCSVDialogOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
