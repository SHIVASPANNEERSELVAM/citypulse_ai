'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { reportsApi } from '@/lib/api';
import { Report } from '@/types';
import { useRouter } from 'next/navigation';
import { STATUS_CONFIG, SEVERITY_CONFIG, timeAgo } from '@/lib/constants';

interface TopNavProps {
  title: string;
  subtitle?: string;
}

export default function TopNav({ title, subtitle }: TopNavProps) {
  const { user, isAuthority } = useAuth();
  const router = useRouter();

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Report[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notifications state
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Report[]>([]);
  const [unread, setUnread] = useState(0);
  const notiRef = useRef<HTMLDivElement>(null);

  // Load recent high/critical reports as notifications
  useEffect(() => {
    if (!isAuthority) return;
    reportsApi.list({ limit: 20 }).then((res) => {
      const recent = res.data.filter(
        (r: Report) => r.severity === 'HIGH' || r.severity === 'CRITICAL'
      ).slice(0, 5);
      setNotifications(recent);
      setUnread(recent.filter((r: Report) => r.status === 'PENDING').length);
    }).catch(() => {});
  }, [isAuthority]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await reportsApi.list({ limit: 50 });
        const q = query.toLowerCase();
        setResults(
          res.data.filter((r: Report) =>
            r.title?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.category?.toLowerCase().includes(q) ||
            r.address?.toLowerCase().includes(q)
          ).slice(0, 6)
        );
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setQuery('');
        setResults([]);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const goToReport = (r: Report) => {
    const base = isAuthority ? '/authority' : '/citizen';
    router.push(`${base}/reports/${r.id}`);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    setNotiOpen(false);
  };

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">

        {/* Search */}
        <div ref={searchRef} className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2 bg-gray-800 border border-emerald-500/40 rounded-lg px-3 py-1.5 w-64 transition-all">
              <Search className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reports..."
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1 w-full"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={openSearch}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-600 transition-colors"
            >
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500 hidden sm:block">Search...</span>
            </button>
          )}

          {/* Search results dropdown */}
          {searchOpen && (query || searching) && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              {searching ? (
                <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
              ) : results.length === 0 && query ? (
                <div className="p-4 text-center text-sm text-gray-500">No results for "{query}"</div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 px-4 pt-3 pb-1">REPORTS</p>
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => goToReport(r)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{r.title}</p>
                        <p className="text-xs text-gray-500">{r.category} · {timeAgo(r.created_at)}</p>
                      </div>
                      {r.severity && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${SEVERITY_CONFIG[r.severity as keyof typeof SEVERITY_CONFIG]?.bg} ${SEVERITY_CONFIG[r.severity as keyof typeof SEVERITY_CONFIG]?.color}`}>
                          {r.severity}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification bell — authority only */}
        {isAuthority && (
          <div ref={notiRef} className="relative">
            <button
              onClick={() => { setNotiOpen((p) => !p); setUnread(0); }}
              className="relative w-9 h-9 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {notiOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 pt-4 pb-2 border-b border-gray-800">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">High & Critical pending reports</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No urgent alerts</div>
                ) : (
                  <div>
                    {notifications.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => goToReport(r)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-b border-gray-800/50 last:border-0"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${r.severity === 'CRITICAL' ? 'bg-red-400' : 'bg-orange-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{r.title}</p>
                          <p className="text-xs text-gray-500">{r.severity} · {r.status.replace('_', ' ')} · {timeAgo(r.created_at)}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-0.5" />
                      </button>
                    ))}
                    <button
                      onClick={() => { router.push('/authority/reports'); setNotiOpen(false); }}
                      className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-3 transition-colors"
                    >
                      View all reports →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
