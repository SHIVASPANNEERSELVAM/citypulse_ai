'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { Hotspot } from '@/types';
import TopNav from '@/components/layout/TopNav';
import { PageLoader, ErrorState, SeverityBadge, StatusBadge } from '@/components/ui/Badges';
import { MapPin, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { CATEGORY_COLORS } from '@/lib/constants';
import Link from 'next/link';

// Dynamically import map to avoid SSR issues
const HotspotMap = dynamic(() => import('@/components/maps/HotspotMap'), { ssr: false });

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function AuthorityMapPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchHotspots = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await analyticsApi.hotspots(100);
      setHotspots(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  const filtered = severityFilter
    ? hotspots.filter((h) => h.severity === severityFilter)
    : hotspots;

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Pollution Map" />
      <div className="flex-1 flex items-center justify-center"><PageLoader /></div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Pollution Map" />
      <div className="flex-1 p-6"><ErrorState message={error} onRetry={() => fetchHotspots()} /></div>
    </div>
  );

  // Count by severity
  const severityCounts = SEVERITY_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = hotspots.filter((h) => h.severity === s).length;
    return acc;
  }, {});

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'border-red-500/40 bg-red-500/10 text-red-400',
    HIGH: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    MEDIUM: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    LOW: 'border-green-500/40 bg-green-500/10 text-green-400',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav
        title="Pollution Hotspot Map"
        subtitle={`${filtered.length} location${filtered.length !== 1 ? 's' : ''} with geo-coordinates`}
      />
      <div className="flex-1 p-6 flex gap-6 overflow-hidden" style={{ height: 'calc(100vh - 64px - 48px)' }}>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Filters
              </h3>
              <button
                onClick={() => fetchHotspots(true)}
                disabled={refreshing}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setSeverityFilter('')}
                className={`w-full text-xs px-3 py-2 rounded-lg border text-left font-medium transition-all ${
                  severityFilter === ''
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                All Severities ({hotspots.length})
              </button>
              {SEVERITY_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(severityFilter === s ? '' : s)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border text-left font-medium transition-all ${
                    severityFilter === s
                      ? SEVERITY_COLORS[s]
                      : 'border-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {s} ({severityCounts[s] ?? 0})
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Category Legend</h3>
            <div className="space-y-2">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-400">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Report Info */}
          {selected && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Selected</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-white font-medium mb-2 line-clamp-2">{selected.title}</p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[selected.category] || '#6b7280' }}
                  />
                  <span className="text-xs text-gray-400">{selected.category}</span>
                </div>
                {selected.severity && (
                  <SeverityBadge severity={selected.severity as any} />
                )}
                <StatusBadge status={selected.status as any} />
              </div>
              <Link
                href={`/authority/reports/${selected.id}`}
                className="block w-full text-center text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                View Report →
              </Link>
            </div>
          )}

          {/* Report count */}
          {hotspots.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No geo-located reports yet</p>
              <p className="text-xs text-gray-500 mt-1">Reports with coordinates will appear here</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-gray-800">
          <HotspotMap
            hotspots={filtered}
            onSelect={setSelected}
            selected={selected}
          />
        </div>
      </div>
    </div>
  );
}
