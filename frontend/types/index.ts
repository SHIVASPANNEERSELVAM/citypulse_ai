// ============================================================
// CityPulse AI — Shared TypeScript Types
// ============================================================

export type UserRole = 'citizen' | 'authority' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: User;
}

// ---- Report -----------------------------------------------
export type ReportStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type PollutionCategory =
  | 'Garbage Accumulation'
  | 'Illegal Dumping'
  | 'Open Burning'
  | 'Smoke Pollution'
  | 'Plastic Waste'
  | 'Water Pollution'
  | 'Other';

export interface AIAnalysis {
  id: number;
  report_id: number;
  detected_category: string;
  severity: Severity;
  confidence: number;
  explanation: string;
  recommended_action: string;
  model_name: string;
  created_at: string;
}

export interface AuthorityNote {
  id: number;
  report_id: number;
  author_id: number;
  content: string;
  created_at: string;
  author?: User;
}

export interface StatusHistory {
  id: number;
  old_status?: ReportStatus;
  new_status: ReportStatus;
  note?: string;
  created_at: string;
  changer?: User;
}

export interface Report {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: PollutionCategory;
  latitude?: number;
  longitude?: number;
  address?: string;
  image_url?: string;
  status: ReportStatus;
  severity?: Severity;
  priority?: Priority;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: User;
  ai_analysis?: AIAnalysis;
  notes?: AuthorityNote[];
  status_history?: StatusHistory[];
}

// ---- Analytics --------------------------------------------
export interface OverviewStats {
  total_reports: number;
  pending_reports: number;
  high_critical_reports: number;
  resolved_reports: number;
  in_progress_reports: number;
  avg_resolution_hours: number | null;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface SeverityStat {
  severity: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  total: number;
  resolved: number;
  high_critical: number;
}

export interface Hotspot {
  id: number;
  latitude: number;
  longitude: number;
  category: string;
  severity: string;
  status: string;
  priority: string;
  title: string;
  created_at: string;
}

// ---- UI Helpers -------------------------------------------
export interface ApiError {
  detail: string | { msg: string; type: string }[];
}
