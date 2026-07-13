// ============================================
// Collapsible Sidebar Navigation
// ============================================
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard,
  Target,
  Phone,
  Mic,
  CalendarClock,
  Calendar,
  BarChart3,
  Users,
  FileText,
  Activity,
  Settings,
  HelpCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const prefix = isAdmin ? '/admin' : '/agent';

  const sections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', href: `${prefix}/dashboard`, icon: LayoutDashboard },
        { label: 'Leads', href: `${prefix}/leads`, icon: Target },
        { label: 'Calls', href: `${prefix}/calls`, icon: Phone },
        { label: 'Recordings', href: `${prefix}/recordings`, icon: Mic },
        { label: 'Follow Ups', href: `${prefix}/follow-ups`, icon: CalendarClock },
        { label: 'Calendar', href: `${prefix}/calendar`, icon: Calendar },
        { label: 'Analytics', href: `${prefix}/analytics`, icon: BarChart3 },
      ],
    },
    {
      title: 'TEAM',
      items: [
        ...(isAdmin ? [{ label: 'Users', href: `${prefix}/users`, icon: Users }] : []),
        { label: 'Reports', href: `${prefix}/reports`, icon: FileText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Activity', href: `${prefix}/activity`, icon: Activity },
        { label: 'Settings', href: `${prefix}/settings`, icon: Settings },
        { label: 'Support', href: `${prefix}/support`, icon: HelpCircle },
        { label: 'Profile', href: `${prefix}/profile`, icon: User },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r overflow-hidden select-none"
      style={{
        background: '#111114',
        borderColor: '#1E1E22',
      }}
    >
      {/* Brand header */}
      <div className="flex items-center justify-between px-4 h-[72px] border-b border-[#1E1E22] flex-shrink-0">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <img
              src="/logo.png"
              alt="CodeConnect Logo"
              className="h-9 object-contain"
              style={{ mixBlendMode: 'screen' }}
            />
          </motion.div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center mx-auto flex-shrink-0">
            <img
              src="/logo.png"
              alt="CodeConnect Logo"
              className="w-12 h-12 max-w-none object-cover"
              style={{ objectPosition: 'center 15%', mixBlendMode: 'screen' }}
            />
          </div>
        )}
      </div>

      {/* Navigation scrollable area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em] px-2.5 mb-2 block">
                {section.title}
              </span>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="relative w-full flex items-center gap-2.5 rounded-xl transition-all duration-150 cursor-pointer group"
                    style={{
                      padding: collapsed ? '10px 0' : '9px 12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      color: active ? '#3B82F6' : '#71717A',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active left accent bar */}
                    {active && (
                      <motion.div
                        layoutId="activeAccent"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                        style={{
                          height: '60%',
                          background: '#3B82F6',
                        }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && (
                      <span
                        className="text-[13px] font-medium truncate"
                        style={{
                          color: active ? '#FFFFFF' : '#A1A1AA',
                        }}
                      >
                        {item.label}
                      </span>
                    )}

                    {/* Hover tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-zinc-800 border border-zinc-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer area */}
      <div className="px-2.5 pb-3 pt-2 border-t border-[#1E1E22] flex-shrink-0 space-y-1">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-2.5 rounded-xl py-2 transition-colors text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 cursor-pointer"
          style={{
            padding: collapsed ? '10px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px]" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px]" />
              <span className="text-[13px] font-medium">Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-xl py-2 transition-colors text-zinc-500 hover:text-red-400 hover:bg-red-500/5 cursor-pointer"
          style={{
            padding: collapsed ? '10px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-[13px] font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
