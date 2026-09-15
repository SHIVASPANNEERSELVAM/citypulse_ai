'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, FileText, Map, BarChart3, Settings,
  Plus, AlertTriangle, LogOut, Zap, ChevronRight,
} from 'lucide-react';

const citizenLinks = [
  { href: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citizen/report', label: 'New Report', icon: Plus },
  { href: '/citizen/reports', label: 'My Reports', icon: FileText },
];

const authorityLinks = [
  { href: '/authority/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/authority/reports', label: 'Reports', icon: FileText },
  { href: '/authority/map', label: 'Map', icon: Map },
  { href: '/authority/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const { user, logout, isAuthority } = useAuth();
  const pathname = usePathname();
  const links = isAuthority ? authorityLinks : citizenLinks;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">CityPulse</p>
            <p className="text-xs text-emerald-400 font-medium">AI Platform</p>
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
          isAuthority ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAuthority ? 'bg-purple-400' : 'bg-emerald-400'} animate-pulse`} />
          {isAuthority ? 'Authority' : 'Citizen'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/50 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
