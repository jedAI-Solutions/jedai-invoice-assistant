import { useState, useMemo, useEffect } from "react";
import { BookingTable } from "./BookingTable";
import { BookingDetails } from "./BookingDetails";
import ExportList from "./ExportList";
import MandantSelector from "./MandantSelector";
import ApprovedInvoicesTable from "./ApprovedInvoicesTable";
import { BookingEntry, Mandant, DashboardStats } from "@/types/booking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UnifiedDashboardProps {
  onStatsUpdate: (stats: DashboardStats) => void;
  selectedMandant: string;
  selectedTimeframe: string;
}

export const UnifiedDashboard = ({ onStatsUpdate, selectedMandant, selectedTimeframe }: UnifiedDashboardProps) => {
  const { toast } = useToast();
  // Mandant mapping from UI IDs to actual UUIDs in database
  const mandanten: Mandant[] = [
    { id: "0c32475a-29e5-4132-88c0-021fcfc68f44", name: "Mustermann GmbH", shortName: "MM", color: "#3b82f6" },
    { id: "27741e79-8d20-4fe4-90fb-cd20b7abc1bb", name: "Beispiel AG", shortName: "BA", color: "#10b981" },
    { id: "7f678713-d266-42f0-b9c7-07f058a7fa75", name: "Demo KG", shortName: "DK", color: "#f59e0b" },
  ];

  // UI mapping for dropdown selections
  const mandantUIMapping = {
    "m1": "0c32475a-29e5-4132-88c0-021fcfc68f44",
    "m2": "27741e79-8d20-4fe4-90fb-cd20b7abc1bb", 
    "m3": "7f678713-d266-42f0-b9c7-07f058a7fa75"
  };

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
  const [entries, setEntries] = useState<BookingEntry[]>([]);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("90");

  // Load entries from classified_invoices table using raw SQL query
  const fetchEntries = async () => {
    try {
      // Temporarily disabled - no database integration
      setEntries(allEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Fehler",
        description: "Buchungseinträge konnten nicht geladen werden",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [toast]);

  // Set up real-time updates for classified_invoices table
  useEffect(() => {
    const channel = supabase
      .channel('classified-invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classified_invoices'
        },
        () => {
          console.log('Classified invoices updated, automatically refreshing booking overview...');
          // Refresh data when classified_invoices table changes
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter entries based on selected mandant and confidence - only show pending entries
  const filteredEntries = useMemo(() => {
    // Only show entries with status 'pending' in the booking overview
    let filtered = entries.filter(entry => entry.status === 'pending');
    
    // Filter by mandant
    if (selectedMandant !== "all") {
      filtered = filtered.filter(entry => entry.mandantId === selectedMandant);
    }
    
    // Filter by confidence level
    if (confidenceFilter !== "all") {
      switch (confidenceFilter) {
        case "green":
          filtered = filtered.filter(entry => entry.confidence >= 90);
          break;
        case "yellow":
          filtered = filtered.filter(entry => entry.confidence >= 70 && entry.confidence < 90);
          break;
        case "red":
          filtered = filtered.filter(entry => entry.confidence < 70);
          break;
      }
    }
    
    return filtered;
  }, [entries, selectedMandant, confidenceFilter]);

  // Calculate stats based on filtered entries
  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const pendingReviews = filteredEntries.filter(e => e.status === 'pending').length;
    const readyForExport = filteredEntries.filter(e => e.status === 'ready').length;
    const rejectedEntries = filteredEntries.filter(e => e.status === 'rejected').length;
    
    // Calculate saved time: assume manual review takes 5 minutes per document, AI-assisted takes 1 minute
    const manualTimePerDocument = 5; // minutes
    const aiAssistedTimePerDocument = 1; // minutes
    const savedTime = filteredEntries.length * (manualTimePerDocument - aiAssistedTimePerDocument);
    
    const avgConfidence = filteredEntries.length > 0 
      ? filteredEntries.reduce((sum, entry) => sum + entry.confidence, 0) / filteredEntries.length 
      : 0;

    return {
      totalEntries,
      pendingReviews,
      readyForExport,
      rejectedEntries,
      savedTime,
      avgConfidence
    };
  }, [filteredEntries]);

  // Update stats in parent component using useEffect to avoid render phase updates
  useEffect(() => {
    onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  const handleApprove = async (entryId: string) => {
    try {
      const approvedEntry = entries.find(e => e.id === entryId);
      if (approvedEntry) {
        // Add to approved_invoices table
        const { error: approvedError } = await supabase
          .from('approved_invoices')
          .insert({
            classified_invoice_id: parseInt(entryId),
            mandant_id: parseInt(approvedEntry.mandantId) || null,
            mandant_nr: approvedEntry.mandantId,
            mandant: approvedEntry.mandant,
            belegnummer: approvedEntry.document,
            belegdatum: approvedEntry.date,
            betrag: approvedEntry.amount,
            buchungstext: approvedEntry.description,
            konto: approvedEntry.account,
            gegenkonto: approvedEntry.account.startsWith('6') ? '1200' : '9999',
            uststeuerzahl: approvedEntry.taxRate,
            konfidenz: approvedEntry.confidence / 100,
            begruendung: 'Manuell genehmigt'
          });

        if (approvedError) throw approvedError;

        // Update local state - remove from entries since we only show pending entries
        setEntries(prevEntries => 
          prevEntries.filter(entry => entry.id !== entryId)
        );
        
        // Clear selection if the approved entry was selected
        if (selectedEntry?.id === entryId) {
          setSelectedEntry(null);
        }

        toast({
          title: "Erfolg",
          description: "Buchung genehmigt und zur Export-Liste hinzugefügt",
        });
      }
    } catch (error) {
      console.error('Error approving entry:', error);
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht genehmigt werden",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (entryId: string) => {
    try {
      // For now, just remove from local state since we don't have a belege table
      setEntries(prevEntries => 
        prevEntries.filter(entry => entry.id !== entryId)
      );
      
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }

      toast({
        title: "Erfolg",
        description: "Eintrag wurde abgelehnt",
      });
    } catch (error) {
      console.error('Error rejecting entry:', error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht abgelehnt werden",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async (entryId: string, changes: Partial<BookingEntry>) => {
    try {
      // Update local state only for now
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

      toast({
        title: "Erfolg",
        description: "Änderungen wurden gespeichert",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Fehler",
        description: "Änderungen konnten nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      // For now, just remove from local state
      setEntries(prevEntries => 
        prevEntries.filter(entry => entry.id !== entryId)
      );
      
      // Clear selection if the deleted entry was selected
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }

      toast({
        title: "Erfolg",
        description: "Eintrag wurde gelöscht",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  // Handle mandant change internally
  const handleMandantChange = (mandant: string) => {
    // This is handled by parent component through props
  };

  return (
    <div className="space-y-6">
      {/* Mandantenfilter */}
      <MandantSelector
        selectedMandant={selectedMandant}
        onMandantChange={handleMandantChange}
      />
      
      {/* Export Liste */}
      <ExportList />
      
      {/* Klassifizierte Rechnungen */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Klassifizierte Rechnungen</h2>
        <BookingTable
          entries={filteredEntries}
          mandanten={mandanten}
          selectedMandant={selectedMandant}
          onMandantChange={handleMandantChange}
          onEntrySelect={setSelectedEntry}
          onApprove={handleApprove}
          onReject={handleReject}
          selectedEntry={selectedEntry}
          confidenceFilter={confidenceFilter}
          onConfidenceFilterChange={setConfidenceFilter}
        />
      </div>
      
      {/* Buchungsdetails */}
      {selectedEntry && (
        <BookingDetails
          selectedEntry={selectedEntry}
          onApprove={handleApprove}
          onReject={handleReject}
          onSaveChanges={handleSaveChanges}
          onDelete={handleDelete}
        />
      )}
      
      {/* Genehmigte Rechnungen */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Export-Übersicht</h2>
        <ApprovedInvoicesTable selectedMandant={selectedMandant} />
      </div>
    </div>
  );
};
