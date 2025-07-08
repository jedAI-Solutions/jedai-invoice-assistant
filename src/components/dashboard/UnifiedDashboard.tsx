import { useState, useMemo } from "react";
import { BookingTable } from "./BookingTable";
import { BookingDetails } from "./BookingDetails";
import { BookingEntry, Mandant, DashboardStats } from "@/types/booking";

interface UnifiedDashboardProps {
  onStatsUpdate: (stats: DashboardStats) => void;
}

export const UnifiedDashboard = ({ onStatsUpdate }: UnifiedDashboardProps) => {
  // Sample data - in real app this would come from API/database
  const mandanten: Mandant[] = [
    { id: "m1", name: "Mustermann GmbH", shortName: "MM", color: "#3b82f6" },
    { id: "m2", name: "Beispiel AG", shortName: "BA", color: "#10b981" },
    { id: "m3", name: "Demo KG", shortName: "DK", color: "#f59e0b" },
  ];

  const [allEntries] = useState<BookingEntry[]>([
    {
      id: "r1",
      document: "Rechnung_2024_001.pdf",
      date: "2024-01-15",
      amount: 1250.00,
      description: "Büromaterial und Software-Lizenzen",
      account: "6815",
      taxRate: "19%",
      confidence: 74,
      status: 'pending',
      mandant: "Mustermann GmbH",
      mandantId: "m1",
      aiHints: ["Prüfen Sie die Zuordnung zu 6815", "Betrag erscheint ungewöhnlich hoch", "Rechnungsdatum prüfen"],
      createdAt: "2024-01-15T10:30:00Z",
      lastModified: "2024-01-15T10:30:00Z"
    },
    {
      id: "r2", 
      document: "Tankbeleg_2024_002.jpg",
      date: "2024-01-14",
      amount: 87.50,
      description: "Kraftstoff Firmenfahrzeug",
      account: "6670",
      taxRate: "19%",
      confidence: 67,
      status: 'pending',
      mandant: "Beispiel AG",
      mandantId: "m2",
      aiHints: ["Belegqualität niedrig", "Fahrtzweck unklar", "Kilometerstand nicht erkennbar"],
      createdAt: "2024-01-14T14:22:00Z",
      lastModified: "2024-01-14T14:22:00Z"
    },
    {
      id: "r3",
      document: "Unklarer_Beleg_003.pdf", 
      date: "2024-01-13",
      amount: 245.80,
      description: "Geschäftsessen - Details unklar",
      account: "6300",
      taxRate: "19%",
      confidence: 45,
      status: 'pending',
      mandant: "Demo KG",
      mandantId: "m3",
      aiHints: ["Teilnehmer nicht erkennbar", "Geschäftlicher Anlass unklar", "Bewirtungsnachweis unvollständig"],
      createdAt: "2024-01-13T18:15:00Z",
      lastModified: "2024-01-13T18:15:00Z"
    },
    {
      id: "a1",
      document: "Stromrechnung_Dezember_2024.pdf",
      date: "2024-12-15",
      amount: 420.50,
      description: "Stromkosten Büroräume Dezember",
      account: "6400",
      taxRate: "19%",
      confidence: 96,
      status: 'ready',
      mandant: "Mustermann GmbH",
      mandantId: "m1",
      aiHints: ["Automatische Erkennung erfolgreich", "Alle Daten vollständig", "Exportbereit"],
      createdAt: "2024-12-15T09:00:00Z",
      lastModified: "2024-12-15T09:00:00Z"
    },
    {
      id: "a2", 
      document: "Lieferant_ABC_Rechnung_456.pdf",
      date: "2024-12-14",
      amount: 1890.00,
      description: "Büroausstattung und IT-Equipment",
      account: "6815",
      taxRate: "19%",
      confidence: 94,
      status: 'ready',
      mandant: "Beispiel AG",
      mandantId: "m2",
      aiHints: ["Lieferant bekannt", "Standard-Buchung", "Keine Korrekturen nötig"],
      createdAt: "2024-12-14T11:30:00Z",
      lastModified: "2024-12-14T11:30:00Z"
    },
    {
      id: "a3",
      document: "Telefon_Internet_Dezember.pdf", 
      date: "2024-12-01",
      amount: 89.99,
      description: "Telefon- und Internetkosten",
      account: "6320",
      taxRate: "19%",
      confidence: 98,
      status: 'approved',
      mandant: "Demo KG",
      mandantId: "m3",
      aiHints: ["Bereits genehmigt", "Monatlicher Standardposten", "Vollautomatisch verarbeitet"],
      createdAt: "2024-12-01T08:00:00Z",
      lastModified: "2024-12-01T08:00:00Z"
    }
  ]);

  const [selectedEntry, setSelectedEntry] = useState<BookingEntry | null>(null);
  const [selectedMandant, setSelectedMandant] = useState<string>("all");
  const [entries, setEntries] = useState<BookingEntry[]>(allEntries);

  // Filter entries based on selected mandant
  const filteredEntries = useMemo(() => {
    if (selectedMandant === "all") {
      return entries;
    }
    return entries.filter(entry => entry.mandantId === selectedMandant);
  }, [entries, selectedMandant]);

  // Calculate stats based on filtered entries
  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const pendingReviews = filteredEntries.filter(e => e.status === 'pending').length;
    const readyForExport = filteredEntries.filter(e => e.status === 'ready').length;
    const rejectedEntries = filteredEntries.filter(e => e.status === 'rejected').length;
    const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const avgConfidence = filteredEntries.length > 0 
      ? filteredEntries.reduce((sum, entry) => sum + entry.confidence, 0) / filteredEntries.length 
      : 0;

    const newStats: DashboardStats = {
      totalEntries,
      pendingReviews,
      readyForExport,
      rejectedEntries,
      totalAmount,
      avgConfidence
    };

    onStatsUpdate(newStats);
    return newStats;
  }, [filteredEntries, onStatsUpdate]);

  const handleApprove = (entryId: string) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: 'approved' as const, lastModified: new Date().toISOString() }
          : entry
      )
    );
    
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(prev => prev ? { ...prev, status: 'approved' } : null);
    }
  };

  const handleReject = (entryId: string) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: 'rejected' as const, lastModified: new Date().toISOString() }
          : entry
      )
    );
    
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(prev => prev ? { ...prev, status: 'rejected' } : null);
    }
  };

  const handleSaveChanges = (entryId: string, changes: Partial<BookingEntry>) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === entryId 
          ? { ...entry, ...changes, lastModified: new Date().toISOString() }
          : entry
      )
    );
    
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(prev => prev ? { ...prev, ...changes } : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Booking Table */}
      <BookingTable
        entries={filteredEntries}
        mandanten={mandanten}
        selectedMandant={selectedMandant}
        onMandantChange={setSelectedMandant}
        onEntrySelect={setSelectedEntry}
        onApprove={handleApprove}
        onReject={handleReject}
        selectedEntry={selectedEntry}
      />

      {/* Booking Details */}
      <BookingDetails
        selectedEntry={selectedEntry}
        onApprove={handleApprove}
        onReject={handleReject}
        onSaveChanges={handleSaveChanges}
      />
    </div>
  );
};