// ============================================
// Analytics Page — Charts Dashboard
// ============================================
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import dashboardService from '@/services/dashboard.service';

const COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F97316', '#EF4444', '#06B6D4', '#F59E0B'];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs border shadow-xl" style={{ background: '#1C1C24', borderColor: '#27272A' }}>
      <p className="text-zinc-400 mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardService.getAdminDashboard,
  });

  const stats = data?.data || {};

  const weeklyCalls = stats.weeklyCalls || [
    { day: 'Mon', calls: 0 }, { day: 'Tue', calls: 0 },
    { day: 'Wed', calls: 0 }, { day: 'Thu', calls: 0 },
    { day: 'Fri', calls: 0 },
  ];

  const leadSources = stats.leadSources || [
    { name: 'Website', value: 40 }, { name: 'Referral', value: 25 },
    { name: 'Social', value: 20 }, { name: 'Cold List', value: 15 },
  ];

  const statusBreakdown = stats.statusBreakdown || [
    { name: 'Not Called', value: 30 }, { name: 'Called', value: 20 },
    { name: 'Interested', value: 15 }, { name: 'Converted', value: 10 },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-10 w-48 rounded-xl bg-zinc-800/30 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-zinc-800/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-xs text-zinc-500 mt-1">Performance insights and metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Calls */}
        <div className="rounded-2xl border p-5" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <h3 className="text-sm font-bold text-white mb-4">Weekly Call Volume</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyCalls}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="calls" stroke="#3B82F6" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources Pie */}
        <div className="rounded-2xl border p-5" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <h3 className="text-sm font-bold text-white mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leadSources} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {leadSources.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {leadSources.map((s: any, i: number) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-zinc-400">{s.name}</span>
                <span className="font-bold text-zinc-300">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown Bar */}
        <div className="rounded-2xl border p-5" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <h3 className="text-sm font-bold text-white mb-4">Lead Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusBreakdown}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-2xl border p-5" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <h3 className="text-sm font-bold text-white mb-4">Conversion Funnel</h3>
          <div className="space-y-3 py-4">
            {[
              { label: 'Total Leads', value: stats.totalLeads || 0, pct: 100, color: '#3B82F6' },
              { label: 'Called', value: stats.calledLeads || 0, pct: stats.totalLeads ? Math.round(((stats.calledLeads || 0) / stats.totalLeads) * 100) : 0, color: '#8B5CF6' },
              { label: 'Interested', value: stats.interestedLeads || 0, pct: stats.totalLeads ? Math.round(((stats.interestedLeads || 0) / stats.totalLeads) * 100) : 0, color: '#F97316' },
              { label: 'Converted', value: stats.conversions || 0, pct: stats.totalLeads ? Math.round(((stats.conversions || 0) / stats.totalLeads) * 100) : 0, color: '#22C55E' },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{step.label}</span>
                  <span className="font-bold text-zinc-300">{step.value} <span className="text-zinc-500 font-normal">({step.pct}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${step.pct}%`, background: step.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
