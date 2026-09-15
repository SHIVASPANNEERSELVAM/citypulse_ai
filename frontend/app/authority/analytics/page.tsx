'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import {
  OverviewStats, CategoryStat, SeverityStat, TrendPoint,
} from '@/types';
import TopNav from '@/components/layout/TopNav';
import { StatCard, PageLoader, ErrorState } from '@/components/ui/Badges';
import {
  FileText, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Activity, BarChart3, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CATEGORY_COLORS } from '@/lib/constants';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#eab308',
  VERIFIED: '#3b82f6',
  ASSIGNED: '#a855f7',
  IN_PROGRESS: '#f97316',
  RESOLVED: '#22c55e',
  REJECTED: '#ef4444',
};

const CustomTooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '12px',
  padding: '8px 14px',
  color: '#fff',
  fontSize: '12px',
};

export default function AuthorityAnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [severity, setSeverity] = useState<SeverityStat[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [statusDist, setStatusDist] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendDays, setTrendDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, catRes, sevRes, trendsRes, statusRes] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.categories(),
        analyticsApi.severity(),
        analyticsApi.trends(trendDays),
        analyticsApi.statusDistribution(),
      ]);
      setStats(statsRes.data);
      setCategories(catRes.data);
      setSeverity(sevRes.data);
      setTrends(trendsRes.data);
      setStatusDist(statusRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [trendDays]);

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Analytics" />
      <div className="flex-1 flex items-center justify-center"><PageLoader /></div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Analytics" />
      <div className="flex-1 p-6"><ErrorState message={error} onRetry={() => fetchAll()} /></div>
    </div>
  );

  const resolutionRate = stats && stats.total_reports > 0
    ? Math.round((stats.resolved_reports / stats.total_reports) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Analytics" subtitle="Insights & pollution trends" />
      <div className="flex-1 p-6 space-y-6">

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Reports" value={stats?.total_reports ?? 0} icon={FileText} color="emerald" />
          <StatCard label="Pending" value={stats?.pending_reports ?? 0} icon={Clock} color="orange" />
          <StatCard label="High/Critical" value={stats?.high_critical_reports ?? 0} icon={AlertTriangle} color="red" />
          <StatCard label="In Progress" value={stats?.in_progress_reports ?? 0} icon={Activity} color="blue" />
          <StatCard label="Resolved" value={stats?.resolved_reports ?? 0} icon={CheckCircle} color="purple" />
          <StatCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={TrendingUp}
            color="emerald"
            sub={stats?.avg_resolution_hours != null ? `~${stats.avg_resolution_hours}h avg` : undefined}
          />
        </div>

        {/* Trends Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-white">Report Trends</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily submission and resolution over time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[7, 14, 30, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTrendDays(d)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      trendDays === d
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchAll(true)}
                disabled={refreshing}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  stroke="#374151"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={CustomTooltipStyle}
                  labelFormatter={(v) => new Date(v as string).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#10b981" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#06b6d4" fill="url(#gradResolved)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="high_critical" name="High/Critical" stroke="#ef4444" fill="url(#gradCritical)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Category Bar Chart */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-1">By Category</h2>
            <p className="text-xs text-gray-400 mb-5">Reports by pollution type</p>
            {categories.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categories} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="#374151"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    width={130}
                  />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                    {categories.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Severity Pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-1">By Severity</h2>
            <p className="text-xs text-gray-400 mb-5">Severity distribution</p>
            {severity.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={severity}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {severity.map((entry) => (
                        <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CustomTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {severity.map((s) => (
                    <div key={s.severity} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: SEVERITY_COLORS[s.severity] || '#6b7280' }}
                        />
                        <span className="text-gray-400">{s.severity}</span>
                      </div>
                      <span className="text-white font-medium">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        {statusDist.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-1">Status Distribution</h2>
            <p className="text-xs text-gray-400 mb-5">Current status breakdown of all reports</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {statusDist.map((s) => {
                const total = statusDist.reduce((acc, x) => acc + x.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                const color = STATUS_COLORS[s.status] || '#6b7280';
                return (
                  <div key={s.status} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#1f2937" strokeWidth="8" />
                        <circle
                          cx="32" cy="32" r="26"
                          fill="none"
                          stroke={color}
                          strokeWidth="8"
                          strokeDasharray={`${pct * 1.634} 163.4`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{s.count}</span>
                    </div>
                    <p className="text-xs font-medium text-white">{s.status.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
