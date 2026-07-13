// ============================================
// Top Navigation Bar
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  MessageSquare,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import notificationService from '@/services/notification.service';
import CommandPalette from './command-palette';

interface TopBarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function TopBar({ onMobileMenuToggle, isMobileMenuOpen }: TopBarProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const prefix = isAdmin ? '/admin' : '/agent';

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    refetchInterval: 30000,
  });

  const notifications = notifData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => {
      setProfileOpen(false);
      setNotifOpen(false);
    };
    if (profileOpen || notifOpen) {
      setTimeout(() => document.addEventListener('click', handleClick), 0);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [profileOpen, notifOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {}
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8 border-b backdrop-blur-xl"
        style={{
          height: '72px',
          background: 'rgba(11, 11, 15, 0.85)',
          borderColor: '#1E1E22',
        }}
      >
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden text-zinc-400 hover:text-white cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors hover:border-zinc-600 cursor-pointer"
            style={{
              background: '#141418',
              borderColor: '#27272A',
            }}
          >
            <Search className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-[9px] font-mono font-bold text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 ml-4">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Date display */}
          <span className="hidden md:block text-[11px] text-zinc-500 font-medium mr-2">
            {format(new Date(), 'EEE, MMM d yyyy')}
          </span>

          {/* Quick Add Lead */}
          <button
            onClick={() => router.push(`${prefix}/leads?action=new`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50"
                style={{ background: '#171717', borderColor: '#27272A' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n: any) => (
                      <div
                        key={n._id}
                        className="px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                        style={{ opacity: n.isRead ? 0.6 : 1 }}
                      >
                        <p className="text-xs text-white font-medium truncate">{n.title}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-zinc-800 mx-1 hidden sm:block" />

          {/* Profile avatar & dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                }}
              >
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="hidden md:block text-left leading-none">
                <span className="text-xs font-semibold text-white block">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">
                  {user?.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hidden md:block" />
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl overflow-hidden z-50"
                style={{ background: '#171717', borderColor: '#27272A' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-zinc-800">
                  <p className="text-xs font-bold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setProfileOpen(false); router.push(`${prefix}/profile`); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); router.push(`${prefix}/settings`); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                  <div className="my-1 border-t border-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Overlay */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
