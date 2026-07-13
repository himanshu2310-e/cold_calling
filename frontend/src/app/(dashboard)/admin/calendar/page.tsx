// ============================================
// Premium Notion / Motion Style Calendar Redesign
// ============================================
'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Check,
  Clock,
  User,
  Phone,
  Building2,
  Calendar,
  X,
  ExternalLink,
  PhoneCall,
  Activity,
  TrendingUp,
  AlertTriangle,
  Play,
  FileText
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfDay, endOfDay, parseISO, isPast
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import followupService from '@/services/followup.service';
import leadService from '@/services/lead.service';

export default function AdminCalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Create follow up form states
  const [formLeadId, setFormLeadId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formNotes, setFormNotes] = useState('');

  // Fetch follow-ups
  const { data: followupsData, refetch } = useQuery({
    queryKey: ['followups-cal'],
    queryFn: () => followupService.getFollowUps(),
  });
  const followUps = followupsData?.data || [];

  // Fetch leads for select option dropdown
  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadService.getLeads({ limit: 100 }),
    enabled: createModalOpen,
  });
  const leads = leadsData?.data || [];

  // Calculations for main views
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const getEventsForDay = (day: Date) => {
    return followUps.filter((fu: any) => fu.scheduledDate && isSameDay(new Date(fu.scheduledDate), day));
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return followUps.filter((fu: any) => {
      const leadName = fu.lead?.fullName || '';
      const notes = fu.notes || '';
      const matchesSearch = !searchQuery ||
        leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || 
        (priorityFilter === 'high' && fu.lead?.priority === 'high') ||
        (priorityFilter === 'medium' && fu.lead?.priority === 'medium') ||
        (priorityFilter === 'low' && fu.lead?.priority === 'low');
        
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'completed' && fu.isCompleted) ||
        (statusFilter === 'pending' && !fu.isCompleted);
        
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [followUps, searchQuery, priorityFilter, statusFilter]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = followUps.length;
    const completed = followUps.filter((f: any) => f.isCompleted).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [followUps]);

  // Helper colors mapping
  const getEventStyles = (ev: any) => {
    if (ev.isCompleted) return { border: 'border-[#22c55e]', bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]' };
    const priority = ev.lead?.priority || 'medium';
    if (priority === 'high') return { border: 'border-[#ef4444]', bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]' };
    if (priority === 'medium') return { border: 'border-[#f97316]', bg: 'bg-[#f97316]/10', text: 'text-[#f97316]' };
    return { border: 'border-[#3b82f6]', bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]' };
  };

  // Navigation handlers
  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setSelectedDate(addWeeks(selectedDate, 1));
    else if (viewMode === 'day') setSelectedDate(addDays(selectedDate, 1));
  };

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setSelectedDate(subWeeks(selectedDate, 1));
    else if (viewMode === 'day') setSelectedDate(subDays(selectedDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Complete followup handler
  const handleMarkComplete = async (id: string) => {
    try {
      await followupService.completeFollowUp(id);
      toast.success('Follow-up call completed');
      queryClient.invalidateQueries({ queryKey: ['followups-cal'] });
      setSelectedEvent(null);
    } catch {
      toast.error('Failed to complete follow-up');
    }
  };

  // Create followup handler
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLeadId || !formDate || !formTime) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const scheduledDate = `${formDate}T${formTime}:00`;
      await followupService.createFollowUp({
        leadId: formLeadId,
        scheduledDate,
        notes: formNotes,
      });
      toast.success('New follow-up call scheduled');
      setCreateModalOpen(false);
      setFormLeadId('');
      setFormDate('');
      setFormNotes('');
      queryClient.invalidateQueries({ queryKey: ['followups-cal'] });
    } catch {
      toast.error('Failed to schedule follow-up');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 text-white min-h-screen">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-xs text-zinc-500 mt-1">Schedule and manage follow-ups</p>
        </div>
        
        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#141418] border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'agenda' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Agenda
            </button>
          </div>
          
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Column 1: Sidebar Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Calendar Stats Summary */}
          <div className="rounded-2xl border border-zinc-800/80 p-4 space-y-3" style={{ background: '#141418' }}>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Metrics Overview</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#171717]/80 rounded-xl p-3 border border-zinc-800 text-center">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">Total</span>
                <span className="text-lg font-bold mt-1 block">{stats.total}</span>
              </div>
              <div className="bg-[#22c55e]/5 rounded-xl p-3 border border-[#22c55e]/10 text-center">
                <span className="text-[9px] text-green-500/80 block uppercase font-bold">Done</span>
                <span className="text-lg font-bold text-green-500 mt-1 block">{stats.completed}</span>
              </div>
              <div className="bg-[#f97316]/5 rounded-xl p-3 border border-[#f97316]/10 text-center">
                <span className="text-[9px] text-orange-500/80 block uppercase font-bold">Pending</span>
                <span className="text-lg font-bold text-orange-400 mt-1 block">{stats.pending}</span>
              </div>
            </div>
          </div>

          {/* Compact Mini Navigation Calendar */}
          <div className="rounded-2xl border border-zinc-800/80 p-4" style={{ background: '#141418' }}>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-white">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="w-6 h-6 rounded-md hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="w-6 h-6 rounded-md hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <span key={idx} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{day}</span>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, i) => {
                const sameMonth = isSameMonth(day, currentDate);
                const active = isSameDay(day, selectedDate);
                const hasEvents = getEventsForDay(day).length > 0;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(day); setCurrentDate(day); }}
                    className={`w-7 h-7 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center relative cursor-pointer transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : isToday(day)
                        ? 'border border-blue-500/50 text-blue-400'
                        : sameMonth
                        ? 'text-zinc-300 hover:bg-zinc-800'
                        : 'text-zinc-600'
                    }`}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasEvents && !active && (
                      <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick actions presets */}
          <div className="rounded-2xl border border-zinc-800/80 p-4 space-y-2.5" style={{ background: '#141418' }}>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Quick Action Presets</h3>
            <button
              onClick={() => { setFormNotes('Follow up call scheduled'); setCreateModalOpen(true); }}
              className="w-full text-left py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-colors"
            >
              <span>Schedule Call</span>
              <Phone className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </button>
            <button
              onClick={() => { setFormNotes('Meeting scheduled to discuss details'); setCreateModalOpen(true); }}
              className="w-full text-left py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-colors"
            >
              <span>Schedule Meeting</span>
              <Activity className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            </button>
            <button
              onClick={() => { setFormNotes('Lead callback reminder'); setCreateModalOpen(true); }}
              className="w-full text-left py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-colors"
            >
              <span>Add Reminder</span>
              <Clock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Columns 2-4: Main Calendar Control Panel */}
        <div className="xl:col-span-3 space-y-4">
          {/* Internal Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141418] border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-lg hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-semibold hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-lg hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-bold text-white px-2">
                {viewMode === 'month'
                  ? format(currentDate, 'MMMM yyyy')
                  : viewMode === 'week'
                  ? `Week of ${format(startOfWeek(selectedDate), 'MMM d, yyyy')}`
                  : format(selectedDate, 'MMMM d, yyyy')
                }
              </span>
            </div>

            {/* In-view search and priority filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0B0B0F] border border-zinc-800 text-xs text-white rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-zinc-700 w-44"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#0B0B0F] border border-zinc-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-700"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0B0B0F] border border-zinc-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-700"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Visual Canvas Container */}
          <div
            className="rounded-2xl border border-zinc-800/80 overflow-hidden"
            style={{ background: '#141418' }}
          >
            {/* MONTH VIEW */}
            {viewMode === 'month' && (
              <div>
                <div className="grid grid-cols-7 border-b border-zinc-800">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="p-3 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {monthDays.map((day, i) => {
                    const inMonth = isSameMonth(day, currentDate);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const dayEvents = getEventsForDay(day).filter((fu: any) => {
                      const leadName = fu.lead?.fullName || '';
                      const notes = fu.notes || '';
                      const matchesSearch = !searchQuery ||
                        leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        notes.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      const matchesPriority = priorityFilter === 'all' || 
                        (priorityFilter === 'high' && fu.lead?.priority === 'high') ||
                        (priorityFilter === 'medium' && fu.lead?.priority === 'medium') ||
                        (priorityFilter === 'low' && fu.lead?.priority === 'low');
                        
                      const matchesStatus = statusFilter === 'all' ||
                        (statusFilter === 'completed' && fu.isCompleted) ||
                        (statusFilter === 'pending' && !fu.isCompleted);
                        
                      return matchesSearch && matchesPriority && matchesStatus;
                    });

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-[110px] p-2 border-b border-r border-zinc-800/40 relative hover:bg-zinc-800/20 transition-all flex flex-col group ${
                          isWeekend ? 'bg-zinc-950/20' : ''
                        }`}
                        style={{ opacity: inMonth ? 1 : 0.3 }}
                      >
                        <span
                          className={`text-[10px] font-bold inline-flex items-center justify-center w-5 h-5 rounded-full mb-1 transition-colors ${
                            isToday(day)
                              ? 'bg-blue-600 text-white'
                              : isSameDay(day, selectedDate)
                              ? 'border border-zinc-700 text-white'
                              : 'text-zinc-500 group-hover:text-zinc-300'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        
                        <div className="space-y-1 overflow-y-auto flex-1 max-h-[80px]">
                          {dayEvents.slice(0, 3).map((ev: any) => {
                            const custom = getEventStyles(ev);
                            return (
                              <motion.div
                                key={ev._id}
                                whileHover={{ scale: 1.02 }}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                className={`text-[9px] font-semibold px-2 py-1 rounded-md border-l-2 ${custom.border} ${custom.bg} ${custom.text} truncate cursor-pointer flex items-center justify-between`}
                              >
                                <span className="truncate">{ev.lead?.fullName || 'Follow-up'}</span>
                                <span className="text-[7px] opacity-70 font-mono">
                                  {ev.scheduledDate ? format(new Date(ev.scheduledDate), 'h:mm a') : ''}
                                </span>
                              </motion.div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-zinc-500 font-bold block pl-1">
                              +{dayEvents.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === 'week' && (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 border-b border-zinc-800 min-w-[700px]">
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`p-3 text-center border-r border-zinc-800/40 cursor-pointer hover:bg-zinc-800/10 transition-colors ${
                        isToday(day) ? 'bg-blue-900/10' : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider mb-1">
                        {format(day, 'EEE')}
                      </span>
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday(day) ? 'bg-blue-600 text-white' : 'text-white'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* 7-column hourly container */}
                <div className="grid grid-cols-7 divide-x divide-zinc-800/40 min-w-[700px] h-[500px] overflow-y-auto p-2">
                  {weekDays.map((day, dayIdx) => {
                    const dayEvents = getEventsForDay(day).filter((fu: any) => {
                      const leadName = fu.lead?.fullName || '';
                      const notes = fu.notes || '';
                      const matchesSearch = !searchQuery ||
                        leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        notes.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      const matchesPriority = priorityFilter === 'all' || 
                        (priorityFilter === 'high' && fu.lead?.priority === 'high') ||
                        (priorityFilter === 'medium' && fu.lead?.priority === 'medium') ||
                        (priorityFilter === 'low' && fu.lead?.priority === 'low');
                        
                      const matchesStatus = statusFilter === 'all' ||
                        (statusFilter === 'completed' && fu.isCompleted) ||
                        (statusFilter === 'pending' && !fu.isCompleted);
                        
                      return matchesSearch && matchesPriority && matchesStatus;
                    });

                    return (
                      <div key={dayIdx} className="space-y-1.5 p-1 min-h-[400px]">
                        {dayEvents.length === 0 ? (
                          <div className="h-full border border-dashed border-zinc-800/20 rounded-xl flex items-center justify-center text-[10px] text-zinc-600 font-mono">
                            Empty
                          </div>
                        ) : (
                          dayEvents.map((ev: any) => {
                            const custom = getEventStyles(ev);
                            return (
                              <motion.div
                                key={ev._id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedEvent(ev)}
                                className={`p-2.5 rounded-xl border-l-2 ${custom.border} ${custom.bg} ${custom.text} cursor-pointer flex flex-col gap-1`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-[10px] font-bold truncate">{ev.lead?.fullName || 'Follow-up'}</span>
                                  {ev.isCompleted && <Check className="w-3 h-3 flex-shrink-0" />}
                                </div>
                                <span className="text-[9px] opacity-75 font-mono">
                                  {ev.scheduledDate ? format(new Date(ev.scheduledDate), 'h:mm a') : '—'}
                                </span>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === 'day' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{format(selectedDate, 'EEEE')}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{format(selectedDate, 'MMMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="divide-y divide-zinc-800/50 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const dayEvents = getEventsForDay(selectedDate).filter((fu: any) => {
                      const leadName = fu.lead?.fullName || '';
                      const notes = fu.notes || '';
                      const matchesSearch = !searchQuery ||
                        leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        notes.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      const matchesPriority = priorityFilter === 'all' || 
                        (priorityFilter === 'high' && fu.lead?.priority === 'high') ||
                        (priorityFilter === 'medium' && fu.lead?.priority === 'medium') ||
                        (priorityFilter === 'low' && fu.lead?.priority === 'low');
                        
                      const matchesStatus = statusFilter === 'all' ||
                        (statusFilter === 'completed' && fu.isCompleted) ||
                        (statusFilter === 'pending' && !fu.isCompleted);
                        
                      return matchesSearch && matchesPriority && matchesStatus;
                    });

                    if (dayEvents.length === 0) {
                      return (
                        <div className="py-12 text-center text-zinc-500 text-xs font-medium">
                          No follow-up calls scheduled for today
                        </div>
                      );
                    }

                    return dayEvents.map((ev: any) => {
                      const custom = getEventStyles(ev);
                      return (
                        <div
                          key={ev._id}
                          onClick={() => setSelectedEvent(ev)}
                          className="py-3 flex items-center justify-between gap-4 hover:bg-zinc-800/10 transition-colors cursor-pointer group px-2 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs">
                              {ev.lead?.fullName?.[0] || 'L'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{ev.lead?.fullName}</h4>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {ev.scheduledDate ? format(new Date(ev.scheduledDate), 'hh:mm a') : '—'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border-l-2 ${custom.border} ${custom.bg} ${custom.text}`}>
                              {ev.lead?.priority || 'medium'}
                            </span>
                            <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">
                              View details →
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* AGENDA VIEW */}
            {viewMode === 'agenda' && (
              <div className="p-4 max-h-[550px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs font-medium">
                    No matching follow-ups found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((ev: any) => {
                      const custom = getEventStyles(ev);
                      const isPastDate = ev.scheduledDate && isPast(new Date(ev.scheduledDate)) && !ev.isCompleted;
                      return (
                        <div
                          key={ev._id}
                          onClick={() => setSelectedEvent(ev)}
                          className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/20 border border-zinc-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs">
                              {ev.lead?.fullName?.[0] || 'L'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{ev.lead?.fullName || 'Follow-up'}</span>
                                {isPastDate && (
                                  <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                                <span className="font-mono">
                                  {ev.scheduledDate ? format(new Date(ev.scheduledDate), 'MMM d, yyyy - hh:mm a') : '—'}
                                </span>
                                {ev.lead?.company && (
                                  <>
                                    <span>•</span>
                                    <span>{ev.lead.company}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {ev.notes && (
                              <p className="text-[10px] text-zinc-400 max-w-[200px] truncate hidden lg:block">
                                {ev.notes}
                              </p>
                            )}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border-l-2 ${custom.border} ${custom.bg} ${custom.text}`}>
                              {ev.isCompleted ? 'Completed' : ev.lead?.priority || 'medium'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          EVENT DETAIL MODAL
          ================================================== */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[500px] rounded-3xl border overflow-hidden shadow-2xl"
              style={{ background: '#141418', borderColor: '#222226' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Event Details</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Follow-up Call Schedule</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Lead profile header */}
                <div className="flex items-center gap-3 bg-[#171717]/80 border border-zinc-800/80 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm">
                    {selectedEvent.lead?.fullName?.[0] || 'L'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{selectedEvent.lead?.fullName}</h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{selectedEvent.lead?.company || 'No Company'}</span>
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    selectedEvent.lead?.priority === 'high'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {selectedEvent.lead?.priority || 'medium'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Phone</span>
                    <span className="text-white font-semibold font-mono block">{selectedEvent.lead?.phone || '—'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Scheduled Date</span>
                    <span className="text-white font-semibold block">
                      {selectedEvent.scheduledDate ? format(new Date(selectedEvent.scheduledDate), 'MMM d, yyyy - hh:mm a') : '—'}
                    </span>
                  </div>
                </div>

                {selectedEvent.notes && (
                  <div className="space-y-1 border-t border-zinc-800/50 pt-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Follow Up Notes</span>
                    <p className="text-zinc-400 mt-1 leading-relaxed bg-[#171717]/40 border border-zinc-800/40 p-3 rounded-xl">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Status</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedEvent.isCompleted ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                      <span className="font-semibold">{selectedEvent.isCompleted ? 'Completed' : 'Pending Callback'}</span>
                    </div>
                  </div>
                  {selectedEvent.agent && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Assigned Agent</span>
                      <span className="text-white font-semibold mt-1 block">
                        {selectedEvent.agent.firstName} {selectedEvent.agent.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-zinc-800 bg-[#171717]/40 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Close
                </button>
                
                {selectedEvent.lead?.phone && (
                  <a
                    href={`tel:${selectedEvent.lead.phone}`}
                    className="btn-secondary text-xs flex items-center gap-1.5 hover:border-blue-500/50 hover:text-blue-400 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                )}

                {!selectedEvent.isCompleted && (
                  <button
                    onClick={() => handleMarkComplete(selectedEvent._id)}
                    className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
          SCHEDULE FOLLOW-UP DIALOG (CREATE MODAL)
          ================================================== */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[500px] rounded-3xl border overflow-hidden shadow-2xl"
              style={{ background: '#141418', borderColor: '#222226' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Schedule Follow-up</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Create a calendar call event</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateFollowUp}>
                <div className="p-6 space-y-4 text-xs">
                  {/* Select Lead */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Lead</label>
                    <select
                      value={formLeadId}
                      onChange={(e) => setFormLeadId(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      {isLoadingLeads ? (
                        <option value="" disabled>Loading leads...</option>
                      ) : (
                        <option value="">Select a Lead...</option>
                      )}
                      {leads.map((l: any) => (
                        <option key={l._id} value={l._id}>
                          {l.fullName} ({l.company || 'No Company'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Scheduled Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Scheduled Time</label>
                      <input
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Call Notes / Preset Description</label>
                    <textarea
                      placeholder="Add summary notes or follow up objective..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={3}
                      className="input-field py-2 resize-none"
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-4 border-t border-zinc-800 bg-[#171717]/40 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="btn-secondary text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Create Schedule</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
