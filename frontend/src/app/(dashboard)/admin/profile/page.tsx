// ============================================
// Profile Page
// ============================================
'use client';

import { useAuthStore } from '@/stores/auth.store';
import { User, Mail, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile</h1>
        <p className="text-xs text-zinc-500 mt-1">Your account information</p>
      </div>

      <div className="max-w-lg space-y-4">
        <div className="rounded-2xl border p-6" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.firstName} {user.lastName}</h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1"
                style={{
                  color: user.role === 'admin' ? '#3B82F6' : '#8B5CF6',
                  background: user.role === 'admin' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                }}
              >
                <Shield className="w-2.5 h-2.5" />
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: User, label: 'Name', value: `${user.firstName} ${user.lastName}` },
              { icon: Shield, label: 'Role', value: user.role },
              { icon: Clock, label: 'Member Since', value: format(new Date(user.createdAt), 'MMMM d, yyyy') },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50">
                <item.icon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{item.label}</span>
                  <span className="text-zinc-300 block mt-0.5">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
