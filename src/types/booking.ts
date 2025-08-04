export interface BookingEntry {
  id: string;
  document: string;
  date: string;
  amount: number;
  description: string;
  account: string;
  taxRate: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'ready' | 'exported' | 'corrected';
  mandant: string;
  mandantId: string;
  aiHints?: string[];
  aiReasoning?: string;
  createdAt: string;
  lastModified: string;
  // AI Classifications table fields
  belegnummer?: string;
  belegdatum?: string;
  betrag?: number;
  buchungstext?: string;
  konto?: string;
  gegenkonto?: string;
  uststeuerzahl?: string;
  mandant_resolved?: string;
  overall_confidence?: number;
  ai_result?: any;
  reasoning?: string;
  uncertainty_factors?: string[];
  check_notes?: string[];
}

export interface Mandant {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export interface DashboardStats {
  totalEntries: number;
  pendingReviews: number;
  approvedBookings: number;
  rejectedEntries: number;
  savedTime: number; // in minutes
  avgConfidence: number;
}