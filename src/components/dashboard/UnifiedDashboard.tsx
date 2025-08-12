import { useState, useMemo, useEffect } from "react";
import { BookingTable } from "./BookingTable";
import { BookingDetails } from "./BookingDetails";
import ExportList from "./ExportList";
import MandantSelector from "./MandantSelector";
import ApprovedInvoicesTable from "./ApprovedInvoicesTable";
import { BookingEntry, Mandant, DashboardStats } from "@/types/booking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UnifiedDashboardProps {
  onStatsUpdate: (stats: DashboardStats) => void;
  selectedMandant: string;
  selectedTimeframe: string;
  onMandantChange?: (mandant: string) => void;
  onRefreshData?: () => void;
}

export const UnifiedDashboard = ({ onStatsUpdate, selectedMandant, selectedTimeframe, onMandantChange, onRefreshData }: UnifiedDashboardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
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
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'modified'>("all");

  // Load entries from ai_classifications table
  const fetchEntries = async () => {
    try {
      // 1) Klassifikationen ohne Join laden (robuster bzgl. RLS/Joins)
      const { data: classifications, error: clsError } = await supabase
        .from('ai_classifications')
        .select('*');

      if (clsError) throw clsError;

      // 2) Zugehörige Mandanten separat laden und mappen
      const mandantIds = Array.from(new Set((classifications || []).map((c: any) => c.mandant_id).filter(Boolean)));
      let mandantMap: Record<string, { name1?: string; mandant_nr?: string }> = {};
      if (mandantIds.length > 0) {
        const { data: mandantRows, error: mErr } = await supabase
           .from('mandant_public_view')
          .select('id, name1, mandant_nr')
          .in('id', mandantIds);
        if (!mErr && mandantRows) {
          mandantMap = mandantRows.reduce((acc: any, m: any) => {
            acc[m.id] = { name1: m.name1, mandant_nr: m.mandant_nr };
            return acc;
          }, {});
        }
      }

      const mappedEntries: BookingEntry[] = (classifications || []).map((item: any) => {
        const mInfo = item.mandant_id ? mandantMap[item.mandant_id] : undefined;
        return {
          id: item.id,
          document: item.belegnummer || 'Unbekannter Beleg',
          date: item.belegdatum || new Date().toISOString().split('T')[0],
          amount: item.betrag || 0,
          description: item.buchungstext || 'Keine Beschreibung',
          account: item.konto || '',
          taxRate: item.uststeuerzahl ? `${item.uststeuerzahl}%` : '19%',
          confidence: Math.round((item.overall_confidence || 0) * 100),
          status: (item.status || 'pending') as any,
          mandant: mInfo?.name1 || item.mandant_resolved || 'Unbekannt',
          mandantId: item.mandant_id || '',
          mandantNr: mInfo?.mandant_nr || '',
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
          document_id: item.document_id,
          check_notes: item.check_notes
        };
      });

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

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefreshData) {
      onRefreshData();
    }
  }, [onRefreshData]);

  // Add a manual refresh function that can be called from outside
  const refreshData = () => {
    console.log('Manual refresh triggered');
    fetchEntries();
  };

  // Expose refresh function to parent via callback
  useEffect(() => {
    if (onRefreshData) {
      (window as any).refreshBookingOverview = refreshData;
    }
  }, []);

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

  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    pendingReviews: 0,
    approvedBookings: 0,
    rejectedEntries: 0,
    savedTime: 0,
    avgConfidence: 0
  });

  // Calculate stats based on database data and current Mandanten-Filter
  const calculateStats = async () => {
    try {
      // Apply Mandant filter to ai_classifications counts
      let totalQuery = supabase
        .from('ai_classifications')
        .select('*', { count: 'exact', head: true });
      if (selectedMandant !== 'all') {
        totalQuery = totalQuery.eq('mandant_id', selectedMandant);
      }
      const { count: totalEntries } = await totalQuery;

      // Pending KPI soll exakt die aktuell sichtbaren Zeilen (Mandant-, Confidence- und Statusfilter) zählen
      const pendingReviews = filteredEntries.filter(e => (
        statusFilter === 'all' ? e.status !== 'approved' : e.status === statusFilter
      )).length;

      // Apply Mandant filter to approved_bookings count
      let approvedQuery = supabase
        .from('approved_bookings')
        .select('*', { count: 'exact', head: true });
      if (selectedMandant !== 'all') {
        approvedQuery = approvedQuery.eq('mandant_id', selectedMandant);
      }
      const { count: approvedBookings } = await approvedQuery;

      // Rejected entries not tracked separately in current model
      const rejectedEntries = 0;

      // Saved time heuristic: 10 minutes per approved booking (filtered by mandant)
      const savedTime = (approvedBookings || 0) * 10;

      // Calculate average confidence for current Mandant (ignore confidence UI filter)
      const entriesForMandant = selectedMandant === 'all' 
        ? entries 
        : entries.filter(e => e.mandantId === selectedMandant);
      const avgConfidence = entriesForMandant.length > 0
        ? entriesForMandant.reduce((sum, e) => sum + (e.confidence || 0), 0) / entriesForMandant.length
        : 0;

      const newStats = {
        totalEntries: totalEntries || 0,
        pendingReviews: pendingReviews || 0,
        approvedBookings: approvedBookings || 0,
        rejectedEntries: rejectedEntries || 0,
        savedTime,
        avgConfidence
      };

      setStats(newStats);
      onStatsUpdate(newStats);
    } catch (error) {
      console.error('Error calculating stats:', error);
      const fallbackStats = {
        totalEntries: 0,
        pendingReviews: 0,
        approvedBookings: 0,
        rejectedEntries: 0,
        savedTime: 0,
        avgConfidence: 0
      };
      setStats(fallbackStats);
      onStatsUpdate(fallbackStats);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [filteredEntries, selectedMandant]);


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
            document_id: approvedEntry.document_id,
            mandant_id: approvedEntry.mandantId,
            mandant_nr: approvedEntry.mandantNr,
            mandant_name: approvedEntry.mandant,
            belegnummer: approvedEntry.document || approvedEntry.belegnummer,
            belegdatum: approvedEntry.date || approvedEntry.belegdatum,
            betrag: approvedEntry.amount || approvedEntry.betrag,
            buchungstext: approvedEntry.description || approvedEntry.buchungstext,
            konto: approvedEntry.account || approvedEntry.konto,
            gegenkonto: approvedEntry.gegenkonto || (approvedEntry.account?.startsWith('6') ? '1200' : '9999'),
            uststeuerzahl: approvedEntry.taxRate || approvedEntry.uststeuerzahl,
            final_confidence: (approvedEntry.confidence || approvedEntry.overall_confidence || 0) / 100,
             approved_by: user?.id || 'unknown',
             approval_method: 'manual'
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

        // Trigger local refresh event for approved invoices view
        window.dispatchEvent(new CustomEvent('approved-booking-created'));

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

  // Reject is not supported; we use permanent delete instead handled by handleDelete

  const handleSaveChanges = async (entryId: string, changes: Partial<BookingEntry>) => {
    try {
      const current = entries.find(e => e.id === entryId);
      if (!current) throw new Error('Eintrag nicht gefunden');

      // Resolve mandant_id: if provided and not a UUID, try to resolve by mandantNr or mandantId as mandant_nr
      let resolvedMandantId: string | undefined = undefined;
      const candidateMandant = changes.mandantId || changes.mandantNr;
      if (candidateMandant) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateMandant);
        if (isUuid) {
          resolvedMandantId = candidateMandant;
        } else {
          const { data: m, error: mErr } = await supabase
            .from('mandant_public_view')
            .select('id')
            .eq('mandant_nr', candidateMandant)
            .maybeSingle();
          if (mErr) throw mErr;
          if (m?.id) resolvedMandantId = m.id;
        }
      }

      const parseTaxRate = (rate?: string) => {
        if (!rate) return undefined;
        return rate.replace('%', '').trim();
      };

      const updateData: any = {
        status: 'modified',
      };
      if (changes.date) updateData.belegdatum = changes.date;
      if (typeof changes.amount === 'number') updateData.betrag = changes.amount;
      if (changes.description) updateData.buchungstext = changes.description;
      if (changes.account) updateData.konto = changes.account;
      const ust = parseTaxRate(changes.taxRate);
      if (ust) updateData.uststeuerzahl = ust;
      if (resolvedMandantId) updateData.mandant_id = resolvedMandantId;

      const { error: updateErr } = await supabase
        .from('ai_classifications')
        .update(updateData)
        .eq('id', entryId);

      if (updateErr) throw updateErr;

      // Update local state after successful DB update
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
        title: 'Erfolg',
        description: "Korrekturen gespeichert und als 'modified' markiert",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Fehler',
        description: 'Änderungen konnten nicht gespeichert werden',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) throw new Error('Eintrag nicht gefunden');

      // Delete related approved_bookings first
      const { error: delApprovedErr } = await supabase
        .from('approved_bookings')
        .delete()
        .eq('classification_id', entryId);
      if (delApprovedErr) throw delApprovedErr;

      // Then delete the classification
      const { error: delClassErr } = await supabase
        .from('ai_classifications')
        .delete()
        .eq('id', entryId);
      if (delClassErr) throw delClassErr;

      // Update local state
      setEntries(prev => prev.filter(e => e.id !== entryId));
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }

      toast({ title: 'Gelöscht', description: 'Eintrag und verbundene Daten wurden entfernt.' });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
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
      
      {/* Klassifizierte Rechnungen */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Klassifizierte Rechnungen</h2>
        <BookingTable
          entries={filteredEntries}
          onEntrySelect={setSelectedEntry}
          onApprove={handleApprove}
          onDelete={handleDelete}
          selectedEntry={selectedEntry}
          confidenceFilter={confidenceFilter}
          onConfidenceFilterChange={setConfidenceFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>
      
      {/* Buchungsdetails */}
      {selectedEntry && (
        <BookingDetails
          selectedEntry={selectedEntry}
          onApprove={handleApprove}
          onSaveChanges={handleSaveChanges}
          onDelete={handleDelete}
        />
      )}
      
      {/* Genehmigte Rechnungen */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Export-Übersicht</h2>
        <ApprovedInvoicesTable selectedMandant={selectedMandant} />
      </div>

      {/* Export-Historie */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Export-Historie</h2>
        <ExportList selectedMandant={selectedMandant} />
      </div>
    </div>
  );
};
