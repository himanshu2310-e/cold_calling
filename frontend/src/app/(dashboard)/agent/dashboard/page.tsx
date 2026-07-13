// Agent Dashboard — uses same data service with agent endpoint
'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Phone, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Plus, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import dashboardService from '@/services/dashboard.service';
import { format } from 'date-fns';

function KPICard({ title, value, change, icon: Icon, color, index }: any) {
  const isPositive = (change || 0) >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="rounded-2xl border p-5" style={{ background: '#141418', borderColor: '#1E1E22' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: isPositive ? '#22C55E' : '#EF4444' }}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </motion.div>
  );
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({ queryKey: ['agent-dashboard'], queryFn: dashboardService.getAgentDashboard });
  const stats = data?.data || {};

  const kpiCards = [
    { title: 'My Leads', value: stats.totalLeads ?? 0, change: 5, icon: Target, color: '#3B82F6' },
    { title: 'Calls Today', value: stats.callsToday ?? 0, change: 10, icon: Phone, color: '#8B5CF6' },
    { title: 'Conversions', value: stats.conversions ?? 0, change: 12, icon: TrendingUp, color: '#22C55E' },
    { title: 'Follow Ups', value: stats.pendingFollowUps ?? 0, change: -5, icon: Clock, color: '#F97316' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-28 rounded-2xl bg-zinc-800/30 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-zinc-800/30 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #141418 0%, #1a1a2e 100%)', borderColor: '#1E1E22' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/5 blur-[60px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.firstName} 👋</h1>
            <p className="text-sm text-zinc-500 mt-1">Your performance for {format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <button onClick={() => router.push('/agent/leads')} className="btn-primary flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /><span>My Leads</span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => <KPICard key={card.title} {...card} index={i} />)}
      </div>
    </div>
  );
}
