// ============================================
// Users Management Page (Admin Only)
// ============================================
'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import userService from '@/services/user.service';
import type { IUser } from '@/types';

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  const users: IUser[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
        <div className="h-10 w-48 rounded-xl bg-zinc-800/30 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-zinc-800/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Team Members</h1>
        <p className="text-xs text-zinc-500 mt-1">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No users found</h3>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">User</th>
                <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                      >
                        {u.firstName[0]}
                      </div>
                      <span className="text-xs font-semibold text-white">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-zinc-400">{u.email}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: u.role === 'admin' ? '#3B82F6' : u.role === 'manager' ? '#8B5CF6' : '#22C55E',
                        background: u.role === 'admin' ? 'rgba(59,130,246,0.12)' : u.role === 'manager' ? 'rgba(139,92,246,0.12)' : 'rgba(34,197,94,0.12)',
                      }}
                    >
                      <Shield className="w-2.5 h-2.5" />
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${u.isActive ? 'text-green-500' : 'text-zinc-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-zinc-600'}`} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-zinc-500 font-mono">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
