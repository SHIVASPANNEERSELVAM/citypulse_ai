import { ReportStatus, Severity, Priority } from '@/types';

export const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  VERIFIED: { label: 'Verified', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  ASSIGNED: { label: 'Assigned', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  RESOLVED: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; dot: string }> = {
  LOW: { label: 'Low', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', dot: 'bg-green-400' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400' },
  HIGH: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400' },
  CRITICAL: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', dot: 'bg-red-400' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  P1: { label: 'P1 Critical', color: 'text-red-400' },
  P2: { label: 'P2 High', color: 'text-orange-400' },
  P3: { label: 'P3 Medium', color: 'text-yellow-400' },
  P4: { label: 'P4 Low', color: 'text-green-400' },
};

export const POLLUTION_CATEGORIES = [
  'Garbage Accumulation',
  'Illegal Dumping',
  'Open Burning',
  'Smoke Pollution',
  'Plastic Waste',
  'Water Pollution',
  'Other',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  'Garbage Accumulation': '#f59e0b',
  'Illegal Dumping': '#ef4444',
  'Open Burning': '#f97316',
  'Smoke Pollution': '#6b7280',
  'Plastic Waste': '#3b82f6',
  'Water Pollution': '#06b6d4',
  'Other': '#8b5cf6',
};

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
