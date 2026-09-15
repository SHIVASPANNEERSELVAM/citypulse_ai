'use client';

import { useEffect, useState } from 'react';
import { reportsApi, getErrorMessage } from '@/lib/api';
import { Report } from '@/types';
import TopNav from '@/components/layout/TopNav';
import ReportCard from '@/components/ui/ReportCard';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Badges';
import { POLLUTION_CATEGORIES } from '@/lib/constants';
import { FileText, Filter } from 'lucide-react';

export default function CitizenReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await reportsApi.list(params);
      setReports(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="My Reports" subtitle={`${reports.length} total reports`} />
      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {['PENDING','VERIFIED','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              <option value="">All Categories</option>
              {POLLUTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {(statusFilter || categoryFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setCategoryFilter(''); }}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReports} />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports found"
            description="Submit your first report or adjust your filters."
            icon={FileText}
          />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
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
  );
}
