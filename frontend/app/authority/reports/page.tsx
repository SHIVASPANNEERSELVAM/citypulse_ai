'use client';

import { useEffect, useState, useCallback } from 'react';
import { reportsApi, getErrorMessage } from '@/lib/api';
import { Report, ReportStatus } from '@/types';
import TopNav from '@/components/layout/TopNav';
import ReportCard from '@/components/ui/ReportCard';
import { PageLoader, EmptyState, ErrorState } from '@/components/ui/Badges';
import { POLLUTION_CATEGORIES } from '@/lib/constants';
import { FileText, Filter, Search, X, RefreshCw } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const STATUSES: ReportStatus[] = ['PENDING', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function AuthorityReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchReports = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (severityFilter) params.severity = severityFilter;
      const res = await reportsApi.list({ ...params, limit: 200 });
      setReports(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter, severityFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const clearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setSeverityFilter('');
    setSearch('');
    router.replace('/authority/reports');
  };

  const hasFilters = statusFilter || categoryFilter || severityFilter || search;

  const filtered = search
    ? reports.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        (r.address ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav
        title="Reports Management"
        subtitle={`${filtered.length} report${filtered.length !== 1 ? 's' : ''}`}
      />
      <div className="flex-1 p-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
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

          {/* Severity Filter */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-2"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Status Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ label: 'All', value: '' }, ...STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchReports()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No reports found"
            description={hasFilters ? 'Try adjusting or clearing your filters.' : 'No reports have been submitted yet.'}
            icon={FileText}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                href={`/authority/reports/${report.id}`}
                showUser
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
