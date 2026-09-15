'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { reportsApi, aiApi, getImageUrl, getErrorMessage } from '@/lib/api';
import { Report, ReportStatus } from '@/types';
import TopNav from '@/components/layout/TopNav';
import { StatusBadge, SeverityBadge, PageLoader, ErrorState } from '@/components/ui/Badges';
import AIAnalysisCard from '@/components/ui/AIAnalysisCard';
import {
  MapPin, Clock, Brain, RefreshCw, ArrowLeft, ChevronDown,
  StickyNote, Send, CheckCircle, User, MessageSquare,
} from 'lucide-react';
import { formatDate, timeAgo } from '@/lib/constants';
import toast from 'react-hot-toast';
import Link from 'next/link';

const VALID_STATUSES: ReportStatus[] = [
  'PENDING', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED',
];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: [],
  REJECTED: [],
};

export default function AuthorityReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | ''>('');

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

  useEffect(() => {
    fetchReport();
  }, [id]);

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

  const handleStatusUpdate = async () => {
    if (!report || !selectedStatus) return;
    setUpdatingStatus(true);
    try {
      await reportsApi.updateStatus(report.id, selectedStatus, statusNote || undefined);
      await fetchReport();
      toast.success(`Status updated to ${selectedStatus}`);
      setSelectedStatus('');
      setStatusNote('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!report || !newNote.trim()) return;
    setAddingNote(true);
    try {
      await reportsApi.addNote(report.id, newNote.trim());
      await fetchReport();
      toast.success('Note added');
      setNewNote('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingNote(false);
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

  const nextStatuses = STATUS_TRANSITIONS[report.status] ?? [];
  const canTransition = nextStatuses.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Report Detail" subtitle={`#${report.id} — ${report.category}`} />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/authority/reports"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Main info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Title & Status */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-xl font-bold text-white">{report.title}</h1>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">{report.category}</span>
                  {report.severity && <SeverityBadge severity={report.severity} />}
                  {report.priority && (
                    <span className="text-xs font-bold text-orange-400 bg-orange-400/10 border border-orange-400/30 px-2.5 py-0.5 rounded-full">
                      {report.priority}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{report.description}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                  {report.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{report.address}
                    </span>
                  )}
                  {report.latitude && report.longitude && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatDate(report.created_at)}
                  </span>
                </div>
                {report.user && (
                  <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-400">
                      Reported by <span className="text-white font-medium">{report.user.full_name}</span>
                      {' '}({report.user.email})
                    </span>
                  </div>
                )}
              </div>

              {/* Image */}
              {report.image_url && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
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
                    Trigger AI analysis to get automated severity assessment and recommended actions.
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

              {/* Re-run AI Analysis if already done */}
              {report.ai_analysis && (
                <div className="flex justify-end">
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
                    {analyzing ? 'Re-analyzing...' : 'Re-run AI Analysis'}
                  </button>
                </div>
              )}

              {/* Authority Notes */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Authority Notes
                  {report.notes && report.notes.length > 0 && (
                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      {report.notes.length}
                    </span>
                  )}
                </h3>
                {report.notes && report.notes.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {report.notes.map((note) => (
                      <div key={note.id} className="bg-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {note.author?.full_name.charAt(0).toUpperCase() ?? 'A'}
                          </div>
                          <span className="text-xs font-medium text-white">{note.author?.full_name ?? 'Authority'}</span>
                          <span className="text-xs text-gray-500 ml-auto">{timeAgo(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-300">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No notes yet. Add internal notes for your team.</p>
                )}

                {/* Add Note */}
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={2}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="self-end px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                  >
                    {addingNote ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Actions & History */}
            <div className="space-y-5">
              {/* Status Update */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Update Status
                </h3>
                {canTransition ? (
                  <div className="space-y-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">Select new status...</option>
                      {nextStatuses.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    {selectedStatus && (
                      <textarea
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="Optional note for this status change..."
                        rows={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                      />
                    )}
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus || !selectedStatus}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updatingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {updatingStatus ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <StatusBadge status={report.status} />
                    <p className="text-xs text-gray-500 mt-2">
                      {report.status === 'RESOLVED' ? 'Report has been resolved.' : 'Report has been rejected.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Status History */}
              {report.status_history && report.status_history.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Status History
                  </h3>
                  <div className="space-y-3">
                    {report.status_history.map((h, idx) => (
                      <div key={h.id} className="relative">
                        {idx < report.status_history!.length - 1 && (
                          <div className="absolute left-[7px] top-5 bottom-0 w-px bg-gray-800" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${
                            h.new_status === 'RESOLVED' ? 'bg-green-400' :
                            h.new_status === 'REJECTED' ? 'bg-red-400' :
                            'bg-emerald-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white">
                              {h.old_status ? `${h.old_status.replace('_', ' ')} → ` : ''}
                              <strong>{h.new_status.replace('_', ' ')}</strong>
                            </p>
                            {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                            <p className="text-xs text-gray-600 mt-0.5">{timeAgo(h.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-white text-sm">Report Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Report ID</span>
                    <span className="text-white font-mono">#{report.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Submitted</span>
                    <span className="text-white">{timeAgo(report.created_at)}</span>
                  </div>
                  {report.resolved_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Resolved</span>
                      <span className="text-green-400">{timeAgo(report.resolved_at)}</span>
                    </div>
                  )}
                  {report.latitude && report.longitude && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coordinates</span>
                      <span className="text-white font-mono text-[10px]">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
