'use client';

import { ReportStatus, Severity, Priority } from '@/types';
import { STATUS_CONFIG, SEVERITY_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-700/30 border-gray-600/30' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity] || { label: severity, color: 'text-gray-400', bg: 'bg-gray-700/30 border-gray-600/30', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, color: 'text-gray-400' };
  return (
    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} rounded-full border-2 border-gray-700 border-t-emerald-500 animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon }: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-600" />
        </div>
      )}
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <div>
        <p className="text-red-400 font-medium">Something went wrong</p>
        <p className="text-gray-400 text-sm mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label, value, sub, icon: Icon, color = 'emerald',
}: {
  label: string; value: string | number; sub?: string;
  icon?: React.ComponentType<{ className?: string }>; color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-cyan-500 shadow-emerald-500/20',
    orange: 'from-orange-500 to-red-500 shadow-orange-500/20',
    blue: 'from-blue-500 to-indigo-500 shadow-blue-500/20',
    red: 'from-red-500 to-rose-500 shadow-red-500/20',
    purple: 'from-purple-500 to-violet-500 shadow-purple-500/20',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.emerald} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
