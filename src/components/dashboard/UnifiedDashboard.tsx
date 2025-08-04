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
  onMandantChange?: (mandant: string) => void;
}

export const UnifiedDashboard = ({ onStatsUpdate, selectedMandant, selectedTimeframe, onMandantChange }: UnifiedDashboardProps) => {
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

  const [allEntries, setAllEntries] = useState<BookingEntry[]>([]);

  const [selectedEntry, setSelectedEntry] = useState<BookingEntry | null>(null);
  const [entries, setEntries] = useState<BookingEntry[]>([]);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("90");

  // Load entries from ai_classifications table
  const fetchEntries = async () => {
    try {
      const { data: classifications, error } = await supabase
        .from('ai_classifications')
        .select(`
          *,
          mandants!inner(id, name1, mandant_nr)
        `);

      if (error) throw error;

      const mappedEntries: BookingEntry[] = classifications?.map((item: any) => ({
        id: item.id,
        document: item.belegnummer || 'Unbekannter Beleg',
        date: item.belegdatum || new Date().toISOString().split('T')[0],
        amount: item.betrag || 0,
        description: item.buchungstext || 'Keine Beschreibung',
        account: item.konto || '',
        taxRate: item.uststeuerzahl ? `${item.uststeuerzahl}%` : '19%',
        confidence: Math.round((item.overall_confidence || 0) * 100),
        status: (item.status === 'approved' ? 'ready' : item.status || 'pending') as any,
        mandant: item.mandants?.name1 || item.mandant_resolved || 'Unbekannt',
        mandantId: item.mandant_id || '',
        aiHints: item.check_notes || [],
        aiReasoning: item.reasoning || '',
        createdAt: item.created_at || new Date().toISOString(),
        lastModified: item.updated_at || new Date().toISOString(),
        // Additional AI classification fields
        belegnummer: item.belegnummer,
        belegdatum: item.belegdatum,
        betrag: item.betrag,
        buchungstext: item.buchungstext,
        konto: item.konto,
        gegenkonto: item.gegenkonto,
        uststeuerzahl: item.uststeuerzahl,
        mandant_resolved: item.mandant_resolved,
        overall_confidence: item.overall_confidence,
        ai_result: item.ai_result,
        reasoning: item.reasoning,
        uncertainty_factors: item.uncertainty_factors,
        check_notes: item.check_notes
      })) || [];

      setEntries(mappedEntries);
      setAllEntries(mappedEntries);
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

  // Set up real-time updates for ai_classifications table
  useEffect(() => {
    const channel = supabase
      .channel('ai-classifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_classifications'
        },
        () => {
          console.log('AI classifications updated, automatically refreshing booking overview...');
          // Refresh data when ai_classifications table changes
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter entries based on selected mandant and confidence
  const filteredEntries = useMemo(() => {
    // Show all entries, not just pending ones
    let filtered = entries;
    
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
        // Update ai_classifications status to 'approved'
        const { error: classificationError } = await supabase
          .from('ai_classifications')
          .update({ status: 'approved' })
          .eq('id', entryId);

        if (classificationError) throw classificationError;

        // Add to approved_bookings table
        const { error: approvedError } = await supabase
          .from('approved_bookings')
          .insert({
            classification_id: entryId,
            mandant_id: approvedEntry.mandantId,
            mandant_nr: approvedEntry.mandantId,
            mandant_name: approvedEntry.mandant,
            belegnummer: approvedEntry.document || approvedEntry.belegnummer,
            belegdatum: approvedEntry.date || approvedEntry.belegdatum,
            betrag: approvedEntry.amount || approvedEntry.betrag,
            buchungstext: approvedEntry.description || approvedEntry.buchungstext,
            konto: approvedEntry.account || approvedEntry.konto,
            gegenkonto: approvedEntry.gegenkonto || (approvedEntry.account?.startsWith('6') ? '1200' : '9999'),
            uststeuerzahl: approvedEntry.taxRate || approvedEntry.uststeuerzahl,
            final_confidence: (approvedEntry.confidence || approvedEntry.overall_confidence || 0) / 100,
            approved_by: 'manual'
          });

        if (approvedError) throw approvedError;

        // Update local state - remove from entries since we don't show approved entries in booking overview
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

  // Handle mandant change and propagate to parent
  const handleMandantChange = (mandant: string) => {
    onMandantChange?.(mandant);
  };

  return (
    <div className="space-y-6">
      {/* Mandantenfilter */}
      <MandantSelector
        selectedMandant={selectedMandant}
        onMandantChange={handleMandantChange}
      />
      
      {/* Export Liste */}
      <ExportList selectedMandant={selectedMandant} />
      
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
