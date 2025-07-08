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
  createdAt: string;
  lastModified: string;
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
  readyForExport: number;
  rejectedEntries: number;
  savedTime: number; // in minutes
  avgConfidence: number;
}