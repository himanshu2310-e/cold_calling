'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import followupService from '@/services/followup.service';

export default function AgentFollowUpsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['followups'], queryFn: () => followupService.getFollowUps() });
  const followUps = data?.data || [];
  const handleComplete = async (id: string) => {
    try { await followupService.completeFollowUp(id); toast.success('Completed'); queryClient.invalidateQueries({ queryKey: ['followups'] }); } catch { toast.error('Failed'); }
  };

  if (isLoading) return <div className="p-8 max-w-[1600px] mx-auto space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-zinc-800/30 animate-pulse" />)}</div>;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold text-white tracking-tight">Follow-Ups</h1><p className="text-xs text-zinc-500 mt-1">{followUps.length} scheduled</p></div>
      {followUps.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <CalendarClock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No follow-ups</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu: any, i: number) => (
            <motion.div key={fu._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-2xl border p-4 flex items-center justify-between gap-4" style={{ background: '#141418', borderColor: '#1E1E22', opacity: fu.isCompleted ? 0.5 : 1 }}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: fu.isCompleted ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', border: `1px solid ${fu.isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}` }}>
                  {fu.isCompleted ? <Check className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-orange-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{typeof fu.lead === 'object' ? fu.lead.fullName : 'Lead'}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{fu.notes || 'No notes'}</p>
                  <span className="text-[10px] text-zinc-600 font-mono">{fu.scheduledDate ? format(new Date(fu.scheduledDate), 'MMM d, h:mm a') : '—'}</span>
                </div>
              </div>
              {!fu.isCompleted && <button onClick={() => handleComplete(fu._id)} className="btn-secondary text-xs flex items-center gap-1 cursor-pointer"><Check className="w-3 h-3" />Done</button>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
