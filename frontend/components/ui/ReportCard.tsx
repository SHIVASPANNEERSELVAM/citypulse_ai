'use client';

import { Report } from '@/types';
import { StatusBadge, SeverityBadge } from './Badges';
import { MapPin, Clock, Brain } from 'lucide-react';
import { timeAgo } from '@/lib/constants';
import { getImageUrl } from '@/lib/api';
import Link from 'next/link';

interface ReportCardProps {
  report: Report;
  href: string;
  showUser?: boolean;
}

export default function ReportCard({ report, href, showUser }: ReportCardProps) {
  return (
    <Link href={href} className="block">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 transition-all cursor-pointer group">
        <div className="flex gap-4">
          {/* Image */}
          {report.image_url && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
              <img
                src={getImageUrl(report.image_url)}
                alt={report.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">
                {report.title}
              </h3>
              <div className="flex-shrink-0">
                <StatusBadge status={report.status} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{report.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">
                {report.category}
              </span>
              {report.severity && <SeverityBadge severity={report.severity} />}
              {report.ai_analysis && (
                <span className="text-xs text-cyan-400 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> AI Analyzed
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
              {report.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.address.substring(0, 30)}{report.address.length > 30 ? '...' : ''}
                </span>
              )}
              {showUser && report.user && (
                <span className="flex items-center gap-1 text-gray-500">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 inline-flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                    {report.user.full_name.charAt(0).toUpperCase()}
                  </span>
                  {report.user.full_name}
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                {timeAgo(report.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
