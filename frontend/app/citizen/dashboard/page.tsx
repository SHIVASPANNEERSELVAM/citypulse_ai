'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reportsApi, getErrorMessage } from '@/lib/api';
import { Report } from '@/types';
import TopNav from '@/components/layout/TopNav';
import ReportCard from '@/components/ui/ReportCard';
import { StatCard, PageLoader, EmptyState, ErrorState } from '@/components/ui/Badges';
import Link from 'next/link';
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await reportsApi.list({ limit: 50 });
      setReports(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const pending = reports.filter((r) => r.status === 'PENDING').length;
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length;
  const highCritical = reports.filter((r) => r.severity === 'HIGH' || r.severity === 'CRITICAL').length;

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="My Dashboard" subtitle={`Welcome back, ${user?.full_name}`} />
      <div className="flex-1 p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Reports" value={reports.length} icon={FileText} color="emerald" />
          <StatCard label="Pending" value={pending} icon={Clock} color="orange" />
          <StatCard label="Resolved" value={resolved} icon={CheckCircle} color="blue" />
          <StatCard label="High/Critical" value={highCritical} icon={AlertTriangle} color="red" />
        </div>

        {/* Quick Action */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white mb-1">Spotted pollution?</h2>
            <p className="text-sm text-gray-400">Submit a report with a photo and location. Our AI will analyze it instantly.</p>
          </div>
          <Link
            href="/citizen/report"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20 flex-shrink-0 ml-4"
          >
            <Plus className="w-4 h-4" /> New Report
          </Link>
        </div>

        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Recent Reports</h2>
            <Link href="/citizen/reports" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <PageLoader />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchReports} />
          ) : reports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              description="Submit your first pollution report to get started."
              icon={FileText}
            />
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  href={`/citizen/reports/${report.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
