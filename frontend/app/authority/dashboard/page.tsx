'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, reportsApi, getErrorMessage } from '@/lib/api';
import { OverviewStats, Report } from '@/types';
import TopNav from '@/components/layout/TopNav';
import { StatCard, PageLoader, ErrorState } from '@/components/ui/Badges';
import { StatusBadge, SeverityBadge } from '@/components/ui/Badges';
import ReportCard from '@/components/ui/ReportCard';
import Link from 'next/link';
import {
  FileText, Clock, AlertTriangle, CheckCircle,
  TrendingUp, ArrowRight, Activity, Zap,
} from 'lucide-react';
import { timeAgo } from '@/lib/constants';

export default function AuthorityDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        analyticsApi.overview(),
        reportsApi.list({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentReports(reportsRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Command Dashboard" />
      <div className="flex-1 flex items-center justify-center"><PageLoader /></div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Command Dashboard" />
      <div className="flex-1 p-6"><ErrorState message={error} onRetry={fetchData} /></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Command Dashboard" subtitle="Smart City Pollution Control Center" />
      <div className="flex-1 p-6 space-y-6">

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Reports" value={stats?.total_reports ?? 0} icon={FileText} color="emerald" />
          <StatCard label="Pending" value={stats?.pending_reports ?? 0} icon={Clock} color="orange" />
          <StatCard label="High/Critical" value={stats?.high_critical_reports ?? 0} icon={AlertTriangle} color="red" />
          <StatCard label="In Progress" value={stats?.in_progress_reports ?? 0} icon={Activity} color="blue" />
          <StatCard label="Resolved" value={stats?.resolved_reports ?? 0} icon={CheckCircle} color="purple" />
          <StatCard
            label="Avg Resolution"
            value={stats?.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : '—'}
            icon={TrendingUp}
            color="emerald"
            sub="Average hours"
          />
        </div>

        {/* AI Status Banner */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-white">AI Analysis Engine Active</p>
              <p className="text-xs text-cyan-400">
                {stats ? (
                  stats.total_reports > 0 ? `${stats.total_reports} reports processed` : 'Ready to analyze reports'
                ) : 'Initializing...'}
              </p>
            </div>
          </div>
          <Link href="/authority/analytics" className="text-sm text-cyan-400 flex items-center gap-1 hover:text-cyan-300">
            View Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>


        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'All Reports', href: '/authority/reports', color: 'emerald' },
            { label: 'View Map', href: '/authority/map', color: 'blue' },
            { label: 'Analytics', href: '/authority/analytics', color: 'purple' },
            { label: 'Pending', href: '/authority/reports?status=PENDING', color: 'orange' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm font-medium text-white hover:border-gray-600 hover:bg-gray-800 transition-all text-center"
            >
              {action.label}
            </Link>
          ))}
        </div>

        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Recent Reports</h2>
            <Link href="/authority/reports" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Manage all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400 text-sm">
                No reports yet. Citizens can submit reports from the app.
              </div>
            ) : (
              recentReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  href={`/authority/reports/${report.id}`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
