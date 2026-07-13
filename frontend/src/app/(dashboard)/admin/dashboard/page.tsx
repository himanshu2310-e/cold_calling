// ============================================
// Admin Dashboard Page — Premium KPI + Charts
// ============================================
'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Target, Phone, PhoneIncoming, PhoneOff,
  Users, TrendingUp, Clock, CheckCircle,
  ArrowUpRight, ArrowDownRight, Plus, Zap,
  Calendar, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import dashboardService from '@/services/dashboard.service';
import { format } from 'date-fns';

// KPI Card Component
function KPICard({
  title, value, change, icon: Icon, color, sparkData, index,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  sparkData?: number[];
  index: number;
}) {
  const isPositive = (change || 0) >= 0;

  // Generate sparkline path
  const sparklinePath = (data: number[]) => {
    if (!data || data.length < 2) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 100;
    const h = 32;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-2xl border p-5 hover:border-zinc-600 transition-all duration-200 group cursor-default"
      style={{
        background: '#141418',
        borderColor: '#1E1E22',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}25`,
          }}
        >
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

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 100 32" className="w-full h-6" preserveAspectRatio="none">
            <path
              d={sparklinePath(sparkData)}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 2px 4px ${color}40)` }}
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

// Chart tooltip
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs border shadow-xl"
      style={{ background: '#1C1C24', borderColor: '#27272A' }}
    >
      <p className="text-zinc-400 mb-0.5">{label}</p>
      {payload.map((item: any, i: number) => (
        <p key={i} style={{ color: item.color }} className="font-bold">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardService.getAdminDashboard,
  });

  const stats = data?.data || {};

  // Generate simple fake sparkline data from value
  const genSpark = (base: number) => {
    const arr: number[] = [];
    for (let i = 0; i < 7; i++) {
      arr.push(Math.max(0, base + Math.floor(Math.random() * base * 0.4 - base * 0.2)));
    }
    return arr;
  };

  const kpiCards = [
    { title: 'Total Leads', value: stats.totalLeads ?? 0, change: 12, icon: Target, color: '#3B82F6' },
    { title: 'Calls Today', value: stats.callsToday ?? 0, change: 8, icon: Phone, color: '#8B5CF6' },
    { title: 'Connected', value: stats.connectedCalls ?? 0, change: 5, icon: PhoneIncoming, color: '#22C55E' },
    { title: 'Missed Calls', value: stats.missedCalls ?? 0, change: -3, icon: PhoneOff, color: '#EF4444' },
    { title: 'Active Agents', value: stats.activeAgents ?? 0, change: 2, icon: Users, color: '#F97316' },
    { title: 'Conversions', value: stats.conversions ?? 0, change: 15, icon: TrendingUp, color: '#10B981' },
    { title: 'Avg Duration', value: stats.avgCallDuration ? `${Math.round(stats.avgCallDuration / 60)}m` : '0m', change: 4, icon: Clock, color: '#06B6D4' },
    { title: 'Follow Ups', value: stats.pendingFollowUps ?? 0, change: -7, icon: CheckCircle, color: '#F59E0B' },
  ];

  // Weekly calls chart data
  const weeklyData = stats.weeklyCalls || [
    { day: 'Mon', calls: 0 }, { day: 'Tue', calls: 0 },
    { day: 'Wed', calls: 0 }, { day: 'Thu', calls: 0 },
    { day: 'Fri', calls: 0 }, { day: 'Sat', calls: 0 },
    { day: 'Sun', calls: 0 },
  ];

  // Lead sources pie
  const sourceData = stats.leadSources || [
    { name: 'Website', value: 40 },
    { name: 'Referral', value: 25 },
    { name: 'Social', value: 20 },
    { name: 'Cold List', value: 15 },
  ];
  const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F97316', '#EF4444', '#06B6D4'];

  if (isLoading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-28 rounded-2xl bg-zinc-800/30 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-zinc-800/30 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-zinc-800/30 animate-pulse" />
          <div className="h-72 rounded-2xl bg-zinc-800/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Hero Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-6 lg:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #141418 0%, #1a1a2e 100%)',
          borderColor: '#1E1E22',
        }}
      >
        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-purple-500/5 blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-[34px] font-bold text-white tracking-tight">
              Welcome back, {user?.firstName} 👋
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Here&apos;s your team&apos;s performance overview for {format(new Date(), 'EEEE, MMMM d')}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/admin/leads?action=new')}
              className="btn-primary flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
            <button
              onClick={() => router.push('/admin/analytics')}
              className="btn-secondary flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <KPICard
            key={card.title}
            {...card}
            index={index}
            sparkData={genSpark(Number(card.value) || 10)}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Calls Area Chart */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Weekly Call Activity</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Number of calls placed each day this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 11 }}
                width={30}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#callsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources Donut */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <h3 className="text-sm font-bold text-white mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {sourceData.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {sourceData.map((source: any, i: number) => (
              <div key={source.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-zinc-400">{source.name}</span>
                </div>
                <span className="font-bold text-zinc-300">{source.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity + Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Calls */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Calls</h3>
            <button
              onClick={() => router.push('/admin/calls')}
              className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          {(stats.recentCalls || []).length === 0 ? (
            <div className="py-8 text-center">
              <Phone className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No recent calls to display</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(stats.recentCalls || []).slice(0, 5).map((call: any) => (
                <div
                  key={call._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
                      {(call.lead?.fullName || 'U')[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{call.lead?.fullName || 'Unknown'}</p>
                      <p className="text-[10px] text-zinc-500">{call.outcome || 'No outcome'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '--'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Follow-ups */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Upcoming Follow-ups</h3>
            <button
              onClick={() => router.push('/admin/follow-ups')}
              className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          {(stats.upcomingFollowUps || []).length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No follow-ups scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(stats.upcomingFollowUps || []).slice(0, 5).map((fu: any) => (
                <div
                  key={fu._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                      {(fu.lead?.fullName || 'U')[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{fu.lead?.fullName || 'Unknown'}</p>
                      <p className="text-[10px] text-zinc-500">{fu.notes || 'No notes'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {fu.scheduledDate ? format(new Date(fu.scheduledDate), 'MMM d, h:mm a') : '--'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
