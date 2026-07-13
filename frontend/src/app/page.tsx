'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        const isAdmin = user?.role === 'admin' || user?.role === 'manager';
        router.push(isAdmin ? '/admin/dashboard' : '/agent/dashboard');
      }
    }
  }, [isAuthenticated, isInitialized, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0B0B0F' }}>
      <div className="spinner w-10 h-10 animate-spin" />
    </div>
  );
}
