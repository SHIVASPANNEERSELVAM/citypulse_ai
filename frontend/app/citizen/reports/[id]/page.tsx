'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { reportsApi, aiApi, getImageUrl, getErrorMessage } from '@/lib/api';
import { Report } from '@/types';
import TopNav from '@/components/layout/TopNav';
import { StatusBadge, SeverityBadge, PageLoader, ErrorState } from '@/components/ui/Badges';
import AIAnalysisCard from '@/components/ui/AIAnalysisCard';
import { MapPin, Clock, Brain, RefreshCw, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/constants';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CitizenReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await reportsApi.get(Number(id));
      setReport(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!report) return;
    setAnalyzing(true);
    try {
      await aiApi.analyze(report.id);
      await fetchReport();
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Report Detail" />
      <div className="flex-1 flex items-center justify-center"><PageLoader /></div>
    </div>
  );

  if (error || !report) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Report Detail" />
      <div className="flex-1 p-6"><ErrorState message={error || 'Report not found'} onRetry={fetchReport} /></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Report Detail" subtitle={`#${report.id}`} />
      <div className="flex-1 p-6 max-w-3xl">
        <Link href="/citizen/reports" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </Link>

        {/* Status & title */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-white">{report.title}</h1>
            <StatusBadge status={report.status} />
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">{report.category}</span>
            {report.severity && <SeverityBadge severity={report.severity} />}
            {report.priority && (
              <span className="text-xs font-bold text-orange-400">{report.priority}</span>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{report.description}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
            {report.address && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.address}</span>
            )}
            {report.latitude && report.longitude && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.latitude}, {report.longitude}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(report.created_at)}</span>
          </div>
        </div>

        {/* Image */}
        {report.image_url && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
            <h3 className="font-semibold text-white mb-3">Submitted Photo</h3>
            <img
              src={getImageUrl(report.image_url)}
              alt="Report"
              className="w-full max-h-80 object-cover rounded-xl"
            />
          </div>
        )}

        {/* AI Analysis */}
        {report.ai_analysis ? (
          <AIAnalysisCard analysis={report.ai_analysis} />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">No AI Analysis Yet</h3>
            <p className="text-sm text-gray-400 mb-4">
              AI analysis runs automatically after submission. You can also trigger it manually.
            </p>
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 mx-auto bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          </div>
        )}

        {/* Status history */}
        {report.status_history && report.status_history.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mt-5">
            <h3 className="font-semibold text-white mb-4">Status History</h3>
            <div className="space-y-3">
              {report.status_history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white">
                      {h.old_status ? `${h.old_status} → ` : ''}<strong>{h.new_status}</strong>
                    </p>
                    {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                    <p className="text-xs text-gray-500">{formatDate(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
