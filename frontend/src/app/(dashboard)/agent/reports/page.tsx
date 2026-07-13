'use client';
import { FileText } from 'lucide-react';
export default function AgentReportsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1><p className="text-xs text-zinc-500 mt-1">Your performance reports</p></div>
      <div className="rounded-2xl border p-12 text-center" style={{ background: '#141418', borderColor: '#1E1E22' }}><FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" /><h3 className="text-sm font-bold text-white mb-1">Reports Coming Soon</h3></div>
    </div>
  );
}
