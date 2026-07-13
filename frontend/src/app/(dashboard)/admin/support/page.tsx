// ============================================
// Support Portal Page
// ============================================
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  HelpCircle, MessageSquare, ChevronDown, ChevronUp, AlertCircle,
  Clock, CheckCircle, ShieldAlert, Send, Plus, ListFilter,
  LifeBuoy, ExternalLink, Globe, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import ticketService from '@/services/ticket.service';

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'leads' | 'dialer' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const FAQ_ITEMS = [
  {
    q: 'How do I bind my Twilio verified number for VoIP calling?',
    a: 'Navigate to the Settings tab, go to "Developer & Keys", and enter your Twilio Account SID, Auth Token, and verified outbound caller ID. Once saved, the dialer modal will automatically route calls through your Twilio trunk gateway.'
  },
  {
    q: 'How are leads assigned to agents automatically?',
    a: 'In Settings under "Lead Distribution", you can select Round Robin (equally assigns leads) or High-Priority First. Warm or hot leads will automatically assign to agents depending on your active setting rules.'
  },
  {
    q: 'Can agents delete leads or export lists to CSV?',
    a: 'By default, delete and CSV export operations are restricted to admin or manager roles. You can, however, enable agent-level CSV import permissions in Settings -> Workspace Details.'
  },
  {
    q: 'What determines the AI confidence score of a lead?',
    a: 'AI Lead Scores are computed dynamically based on calls status outcomes, duration, and notes logs. High duration calls marked "interested" get a higher rating score.'
  }
];

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'my-tickets'>('my-tickets');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'technical' | 'billing' | 'leads' | 'dialer' | 'other'>('technical');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Query tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets', activeView, filterStatus],
    queryFn: () => ticketService.getTickets({
      category: activeView === 'my-tickets' ? 'my-tickets' : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined
    }),
  });

  const tickets = (ticketsData?.data || []) as Ticket[];

  // Submit ticket mutation
  const submitMutation = useMutation({
    mutationFn: () => ticketService.createTicket({ subject, description, category, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Support ticket submitted successfully!');
      setSubject('');
      setDescription('');
      setCategory('technical');
      setPriority('medium');
      setShowSubmitModal(false);
    },
    onError: () => {
      toast.error('Failed to submit support ticket');
    }
  });

  // Update ticket status mutation (Admin/Manager only)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ticketService.updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket status updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update ticket status');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill out all fields');
      return;
    }
    submitMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">In Progress</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">Resolved</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase">Closed</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'low':
        return <span className="text-[10px] text-zinc-500 font-medium">Low Priority</span>;
      case 'medium':
        return <span className="text-[10px] text-zinc-400 font-semibold">Medium Priority</span>;
      case 'high':
        return <span className="text-[10px] text-orange-400 font-bold">High Priority</span>;
      case 'urgent':
        return <span className="text-[10px] text-red-500 font-extrabold animate-pulse">Urgent Priority</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* ============ Header ============ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
              <LifeBuoy className="w-4 h-4 text-white" />
            </div>
            Support Center
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Submit support tickets, browse FAQs, and monitor service health</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Support Ticket
        </button>
      </div>

      {/* ============ Layout Grid ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ============ Column 1 & 2: Tickets & FAQ ============ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tickets list */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b" style={{ borderColor: '#1E1E22' }}>
              <div>
                <h3 className="text-sm font-bold text-white">Your Support Tickets</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Manage and track your active inquiries</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Selector */}
                <div className="flex items-center rounded-xl p-0.5" style={{ background: '#0D0D11', border: '1px solid #1E1E22' }}>
                  <button
                    onClick={() => setActiveView('my-tickets')}
                    className={`px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                      activeView === 'my-tickets' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    My Tickets
                  </button>
                  <button
                    onClick={() => setActiveView('all')}
                    className={`px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                      activeView === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    All System Tickets
                  </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-zinc-900 border rounded-xl px-2.5 py-1.5" style={{ borderColor: '#1E1E22' }}>
                  <Filter className="w-3 h-3 text-zinc-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-[10px] text-zinc-400 font-semibold border-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3 py-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-zinc-800/30 animate-pulse" />
                ))}
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <div
                    key={t._id}
                    className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all duration-300"
                    style={{ background: '#0D0D11', borderColor: '#1E1E22' }}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold text-zinc-500">{t.ticketId}</span>
                        <h4 className="text-xs font-bold text-white truncate">{t.subject}</h4>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{t.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[9px] text-zinc-500 font-medium">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-800">{t.category}</span>
                        {getPriorityBadge(t.priority)}
                        <span>•</span>
                        <span>Submitted on {new Date(t.createdAt).toLocaleDateString()}</span>
                        {t.user && activeView === 'all' && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">by {t.user.firstName} ({t.user.email})</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(t.status)}
                      
                      {/* Admin status update control */}
                      {activeView === 'all' && (
                        <select
                          value={t.status}
                          disabled={updateStatusMutation.isPending}
                          onChange={(e) => updateStatusMutation.mutate({ id: t.ticketId, status: e.target.value })}
                          className="bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-700 rounded px-1.5 py-1 focus:outline-none cursor-pointer hover:bg-zinc-750"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <MessageSquare className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-zinc-400">No support tickets found</h4>
                <p className="text-[10px] text-zinc-600 max-w-xs mx-auto mt-1">Submit a new request using the button above to contact support.</p>
              </div>
            )}
          </div>

          {/* FAQ Accordions */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <div>
              <h3 className="text-sm font-bold text-white">Frequently Asked Questions</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Quick guides and answers to popular inquiries</p>
            </div>

            <div className="space-y-2 pt-2">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border transition-all duration-300 overflow-hidden"
                    style={{ background: '#0D0D11', borderColor: '#1E1E22' }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white cursor-pointer hover:bg-zinc-800/10"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 border-t text-[10px] text-zinc-400 leading-relaxed" style={{ borderColor: '#1E1E22' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ============ Column 3: Health Status & Contact ============ */}
        <div className="space-y-6">
          
          {/* Health Status Widget */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#1E1E22' }}>
              <div>
                <h3 className="text-sm font-bold text-white">System Status</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Active health monitor logs</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            </div>

            <div className="space-y-3 pt-2">
              {[
                { name: 'Core API Server', status: 'Operational', latency: '42ms', color: '#22C55E' },
                { name: 'MongoDB Database', status: 'Operational', latency: '5ms', color: '#22C55E' },
                { name: 'Twilio Gateway SDK', status: 'Active', latency: '120ms', color: '#22C55E' },
                { name: 'Cloudinary Storage', status: 'Active', latency: '95ms', color: '#22C55E' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[10px] p-2.5 rounded-xl bg-zinc-900/60" style={{ border: '1px solid #1E1E22' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-zinc-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold uppercase">{item.status}</span>
                    <span className="text-zinc-600 font-mono text-[9px]">{item.latency}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/10">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-bold text-blue-300">Fast Resolution Guarantee</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">
                  Support tickets are reviewed by our engineering staff within 2 hours. High-priority and urgent tickets get automatically escalated.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact Desk */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <div>
              <h3 className="text-sm font-bold text-white">Direct Contact</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Reach out via standard platforms</p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="mailto:support@coldconnect.com"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                style={{ borderColor: '#1E1E22' }}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Support Email Desk</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">support@coldconnect.com</span>
              </a>

              <a
                href="https://status.coldconnect.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                style={{ borderColor: '#1E1E22' }}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-3.5 h-3.5 text-green-400" />
                  <span>Public Status Page</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* ============ Submit Support Request Modal ============ */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl relative" style={{ background: '#141418', borderColor: '#2E2E33' }}>
            
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#1E1E22' }}>
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Create Support Ticket</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="input-field cursor-pointer font-medium text-xs text-white"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Inquiry</option>
                    <option value="leads">Leads & Uploads</option>
                    <option value="dialer">Dialer Configuration</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Urgency</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="input-field cursor-pointer font-medium text-xs text-white"
                  >
                    <option value="low">Low (Standard reply)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Priority check)</option>
                    <option value="urgent">Urgent (Immediate escalation)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject / Short Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Twilio account SID auth connection timed out"
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Detailed Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please list step-by-step description to reproduce the bug..."
                  rows={4}
                  className="input-field py-2.5 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: '#1E1E22' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  style={{ borderColor: '#1E1E22' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
                >
                  {submitMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
