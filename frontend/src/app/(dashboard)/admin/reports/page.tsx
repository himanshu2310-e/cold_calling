// ============================================
// Reports Page — Performance Analytics & Insights
// ============================================
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  FileText, TrendingUp, Phone, Users, Clock, Download,
  ArrowUpRight, ArrowDownRight, Activity, Calendar,
  BarChart3, Target, Zap, ChevronRight,
} from 'lucide-react';
import dashboardService from '@/services/dashboard.service';
import callService from '@/services/call.service';
import leadService from '@/services/lead.service';
import userService from '@/services/user.service';
import followupService from '@/services/followup.service';

// ---- Constants ----
const COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F97316', '#EF4444', '#06B6D4', '#F59E0B', '#EC4899'];

const OUTCOME_LABELS: Record<string, string> = {
  connected: 'Connected', no_answer: 'No Answer', busy: 'Busy',
  voicemail: 'Voicemail', wrong_number: 'Wrong Number', callback: 'Callback',
  interested: 'Interested', not_interested: 'Not Interested', converted: 'Converted',
};

const STATUS_COLORS: Record<string, string> = {
  'Not Called': '#71717A', 'Called': '#3B82F6', 'Interested': '#F97316',
  'Converted': '#22C55E', 'Callback': '#8B5CF6', 'Follow Up': '#06B6D4',
};

// ---- Custom Tooltip ----
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs border shadow-2xl backdrop-blur-sm" style={{ background: 'rgba(28,28,36,0.95)', borderColor: '#27272A' }}>
      <p className="text-zinc-400 mb-0.5 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ---- Helpers ----
function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ============================================
// Main Component
// ============================================
export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // ---- Data Fetching ----
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardService.getAdminDashboard,
  });

  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ['calls-report'],
    queryFn: () => callService.getCallLogs({ limit: 100 }),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-report'],
    queryFn: () => leadService.getLeads({ limit: 100 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-report'],
    queryFn: userService.getUsers,
  });

  const { data: followupsData } = useQuery({
    queryKey: ['followups-report'],
    queryFn: () => followupService.getFollowUps(),
  });

  const stats = dashData?.data || {};
  const calls = callsData?.data || [];
  const leads = leadsData?.data || [];
  const users = (usersData?.data || []) as any[];
  const followups = followupsData?.data || [];

  const isLoading = dashLoading || callsLoading || leadsLoading;

  // ---- Computed Metrics ----
  const totalLeads = stats.totalLeads || leads.length || 0;
  const totalCalls = Array.isArray(calls) ? calls.length : 0;
  const conversions = stats.conversions || 0;
  const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : '0.0';
  const avgCallDuration = stats.avgCallDuration || 0;
  const pendingFollowUps = stats.pendingFollowUps || 0;
  const connectedCalls = stats.connectedCalls || 0;
  const connectRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : '0.0';

  // Weekly calls chart data
  const weeklyCalls = stats.weeklyCalls || [];

  // Lead sources
  const leadSources = stats.leadSources || [];

  // Status breakdown
  const statusBreakdown = stats.statusBreakdown || [];

  // Outcome distribution from calls
  const outcomeDistribution = useMemo(() => {
    if (!Array.isArray(calls) || calls.length === 0) return [];
    const counts: Record<string, number> = {};
    calls.forEach((c: any) => {
      const outcome = c.outcome || 'unknown';
      counts[outcome] = (counts[outcome] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({ name: OUTCOME_LABELS[key] || key, value }))
      .sort((a, b) => b.value - a.value);
  }, [calls]);

  // Agent performance
  const agentPerformance = useMemo(() => {
    const agentMap: Record<string, { name: string; leads: number; calls: number; conversions: number }> = {};

    // Only count agent users
    const agents = users.filter((u: any) => u.role === 'agent');
    agents.forEach((u: any) => {
      agentMap[u._id] = {
        name: `${u.firstName} ${u.lastName}`,
        leads: 0,
        calls: 0,
        conversions: 0,
      };
    });

    // Count leads per agent
    if (Array.isArray(leads)) {
      leads.forEach((l: any) => {
        const aid = typeof l.assignedTo === 'object' ? l.assignedTo?._id : l.assignedTo;
        if (aid && agentMap[aid]) {
          agentMap[aid].leads++;
          if (l.status === 'converted') agentMap[aid].conversions++;
        }
      });
    }

    // Count calls per agent
    if (Array.isArray(calls)) {
      calls.forEach((c: any) => {
        const aid = typeof c.agent === 'object' ? c.agent?._id : c.agent;
        if (aid && agentMap[aid]) {
          agentMap[aid].calls++;
        }
      });
    }

    return Object.values(agentMap).map((a) => ({
      ...a,
      rate: a.leads > 0 ? ((a.conversions / a.leads) * 100).toFixed(1) : '0.0',
    }));
  }, [leads, calls, users]);

  // Recent activities
  const recentActivities = stats.recentActivities || [];

  // ---- CSV Export ----
  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Leads', String(totalLeads)],
      ['Total Calls', String(totalCalls)],
      ['Conversions', String(conversions)],
      ['Conversion Rate', `${conversionRate}%`],
      ['Avg Call Duration', formatDuration(avgCallDuration)],
      ['Connected Calls', String(connectedCalls)],
      ['Connect Rate', `${connectRate}%`],
      ['Pending Follow-ups', String(pendingFollowUps)],
      [''],
      ['Agent', 'Leads Assigned', 'Calls Made', 'Conversions', 'Conversion Rate'],
      ...agentPerformance.map((a) => [a.name, String(a.leads), String(a.calls), String(a.conversions), `${a.rate}%`]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ColdConnect_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Loading Skeleton ----
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-36 rounded-lg bg-zinc-800/50 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-zinc-800/30 animate-pulse mt-2" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-zinc-800/40 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-800/30 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-zinc-800/30 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-zinc-800/30 animate-pulse" />
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            Reports
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Performance analytics & insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Toggle */}
          <div className="flex items-center rounded-xl p-0.5" style={{ background: '#141418', border: '1px solid #1E1E22' }}>
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  dateRange === range
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ============ KPI Cards ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Leads',
            value: formatNumber(totalLeads),
            icon: Users,
            color: '#3B82F6',
            gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)',
            borderColor: 'rgba(59,130,246,0.15)',
            sub: `${conversions} converted`,
          },
          {
            label: 'Total Calls',
            value: formatNumber(totalCalls),
            icon: Phone,
            color: '#8B5CF6',
            gradient: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)',
            borderColor: 'rgba(139,92,246,0.15)',
            sub: `${connectRate}% connect rate`,
          },
          {
            label: 'Conversion Rate',
            value: `${conversionRate}%`,
            icon: Target,
            color: '#22C55E',
            gradient: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%)',
            borderColor: 'rgba(34,197,94,0.15)',
            sub: `${conversions} of ${totalLeads} leads`,
          },
          {
            label: 'Avg Call Duration',
            value: formatDuration(avgCallDuration),
            icon: Clock,
            color: '#F97316',
            gradient: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)',
            borderColor: 'rgba(249,115,22,0.15)',
            sub: `${pendingFollowUps} pending follow-ups`,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] group"
            style={{
              background: kpi.gradient,
              border: `1px solid ${kpi.borderColor}`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${kpi.color}18`, border: `1px solid ${kpi.color}25` }}
              >
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{kpi.value}</div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">{kpi.label}</div>
            <div className="text-[10px] mt-2 font-medium" style={{ color: kpi.color }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ============ Charts Grid ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Call Volume Trend */}
        <div className="rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Call Volume Trend</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Last 7 days activity</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3B82F615' }}>
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          {weeklyCalls.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyCalls}>
                <defs>
                  <linearGradient id="reportAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E22" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#52525B', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525B', fontSize: 10 }} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="calls" stroke="#3B82F6" strokeWidth={2.5} fill="url(#reportAreaGrad)" dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-xs">No call data available</div>
          )}
        </div>

        {/* Lead Status Distribution */}
        <div className="rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Lead Status Distribution</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Current pipeline breakdown</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B5CF615' }}>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
          </div>
          {statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                {statusBreakdown.map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-zinc-400">{s.name}</span>
                    <span className="font-bold text-zinc-300">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-xs">No status data available</div>
          )}
        </div>

        {/* Lead Sources Bar Chart */}
        <div className="rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Lead Sources</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Where your leads come from</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#22C55E15' }}>
              <Zap className="w-3.5 h-3.5 text-green-400" />
            </div>
          </div>
          {leadSources.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadSources} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E22" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#52525B', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                  {leadSources.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-xs">No source data available</div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Conversion Funnel</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Lead lifecycle progression</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F9731615' }}>
              <Target className="w-3.5 h-3.5 text-orange-400" />
            </div>
          </div>
          <div className="space-y-4 py-2">
            {[
              { label: 'Total Leads', value: totalLeads, pct: 100, color: '#3B82F6' },
              { label: 'Called', value: stats.calledLeads || 0, pct: totalLeads ? Math.round(((stats.calledLeads || 0) / totalLeads) * 100) : 0, color: '#8B5CF6' },
              { label: 'Interested', value: stats.interestedLeads || 0, pct: totalLeads ? Math.round(((stats.interestedLeads || 0) / totalLeads) * 100) : 0, color: '#F97316' },
              { label: 'Converted', value: conversions, pct: totalLeads ? Math.round((conversions / totalLeads) * 100) : 0, color: '#22C55E' },
            ].map((step, idx) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white" style={{ background: step.color }}>
                      {idx + 1}
                    </div>
                    <span className="text-zinc-300 font-medium">{step.label}</span>
                  </div>
                  <span className="font-bold text-white">
                    {step.value}
                    <span className="text-zinc-500 font-normal ml-1">({step.pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#1E1E22' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${step.pct}%`,
                      background: `linear-gradient(90deg, ${step.color}, ${step.color}CC)`,
                      boxShadow: `0 0 12px ${step.color}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Call Outcome Distribution ============ */}
      {outcomeDistribution.length > 0 && (
        <div className="rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Call Outcome Distribution</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Breakdown of all call results</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#06B6D415' }}>
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={outcomeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E22" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525B', fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525B', fontSize: 10 }} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                {outcomeDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ============ Agent Performance + Activity Log ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Agent Performance Table */}
        <div className="lg:col-span-3 rounded-2xl border transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Agent Performance</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Individual agent metrics</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EC489815' }}>
              <Users className="w-3.5 h-3.5 text-pink-400" />
            </div>
          </div>
          {agentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t border-b" style={{ borderColor: '#1E1E22' }}>
                    <th className="text-left py-2.5 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Agent</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Leads</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Calls</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conversions</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map((agent, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-zinc-800/30 transition-colors" style={{ borderColor: '#1E1E22' }}>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: COLORS[idx % COLORS.length] }}
                          >
                            {agent.name.charAt(0)}
                          </div>
                          <span className="text-zinc-200 font-medium">{agent.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-300 font-semibold">{agent.leads}</td>
                      <td className="py-3 px-3 text-center text-zinc-300 font-semibold">{agent.calls}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: '#22C55E18', color: '#22C55E' }}>
                          {agent.conversions}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold" style={{ color: parseFloat(agent.rate) > 0 ? '#22C55E' : '#71717A' }}>
                          {agent.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-600 text-xs">No agent data available</div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="lg:col-span-2 rounded-2xl border transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Activity</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Latest system events</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B15' }}>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="px-5 pb-4">
            {recentActivities.length > 0 ? (
              <div className="space-y-0.5">
                {recentActivities.slice(0, 8).map((act: any, idx: number) => (
                  <div
                    key={act._id || idx}
                    className="flex items-start gap-3 py-2.5 border-b last:border-b-0 transition-colors hover:bg-zinc-800/20 rounded-lg px-2 -mx-2"
                    style={{ borderColor: '#1A1A1E' }}
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0" style={{ background: COLORS[idx % COLORS.length] + '20' }}>
                      <Activity className="w-3 h-3" style={{ color: COLORS[idx % COLORS.length] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-zinc-300 leading-relaxed truncate">
                        <span className="font-semibold text-zinc-200">
                          {act.user?.firstName || 'System'}
                        </span>
                        {' '}{act.action || act.description || 'performed an action'}
                      </p>
                      <p className="text-[9px] text-zinc-600 mt-0.5">{getRelativeTime(act.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-600 text-xs">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* ============ Follow-up Summary ============ */}
      <div className="rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700" style={{ background: '#141418', borderColor: '#1E1E22' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Follow-up Summary</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Scheduled call-back overview</p>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8B5CF615' }}>
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Scheduled',
              value: Array.isArray(followups) ? followups.length : 0,
              color: '#3B82F6',
            },
            {
              label: 'Completed',
              value: Array.isArray(followups) ? followups.filter((f: any) => f.isCompleted).length : 0,
              color: '#22C55E',
            },
            {
              label: 'Pending',
              value: pendingFollowUps,
              color: '#F97316',
            },
            {
              label: 'Completion Rate',
              value: Array.isArray(followups) && followups.length > 0
                ? `${Math.round((followups.filter((f: any) => f.isCompleted).length / followups.length) * 100)}%`
                : '0%',
              color: '#8B5CF6',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4" style={{ background: '#0D0D11', border: '1px solid #1A1A1E' }}>
              <div className="text-xl font-bold text-white" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
