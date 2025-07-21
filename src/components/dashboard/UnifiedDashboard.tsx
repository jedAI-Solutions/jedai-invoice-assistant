import { useState, useMemo, useEffect } from "react";
import { BookingTable } from "./BookingTable";
import { BookingDetails } from "./BookingDetails";
import { ExportList } from "./ExportList";
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
  const [entries, setEntries] = useState<BookingEntry[]>([]);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("90");

  // Load entries from belege table
  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('belege')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert belege data to BookingEntry format
      const convertedEntries: BookingEntry[] = (data || []).map(beleg => {
        const buchungsvorschlag = beleg.ki_buchungsvorschlag as any;
        
        // Map mandant from mandant_id
        const mandant = mandanten.find(m => m.id === beleg.mandant_id);
        
        // Extract AI hints from ki_buchungsvorschlag
        const aiHints = [];
        if (buchungsvorschlag?.hinweise) {
          aiHints.push(...buchungsvorschlag.hinweise);
        }
        if (buchungsvorschlag?.kommentar) {
          aiHints.push(buchungsvorschlag.kommentar);
        }
        
        return {
          id: beleg.beleg_id,
          document: beleg.original_filename,
          date: beleg.belegdatum || new Date().toISOString().split('T')[0],
          amount: buchungsvorschlag?.betrag || 0,
          description: buchungsvorschlag?.buchungstext || 'Unbekannt',
          account: buchungsvorschlag?.konto || '0000',
          taxRate: buchungsvorschlag?.steuersatz || '19%',
          confidence: beleg.konfidenz || 0,
          status: beleg.status as any,
          mandant: mandant?.name || 'Unbekannt',
          mandantId: beleg.mandant_id,
          aiHints: aiHints,
          createdAt: beleg.created_at,
          lastModified: beleg.updated_at
        };
      });

      setEntries(convertedEntries);

      // Auto-add high confidence entries to export list
      const highConfidenceEntries = convertedEntries.filter(entry => 
        entry.confidence >= 90 && (entry.status === 'ready' || entry.status === 'pending')
      );

      for (const entry of highConfidenceEntries) {
        try {
          // Check if entry already exists in export queue
          const { data: existingEntry } = await supabase
            .from('export_queue')
            .select('export_id')
            .eq('buchung_id', entry.id)
            .maybeSingle();

          if (!existingEntry) {
            // Create buchungshistorie entry
            const buchungUuid = crypto.randomUUID();
            
            const { error: buchungError } = await supabase
              .from('buchungshistorie')
              .insert({
                buchung_id: buchungUuid,
                buchungsdatum: entry.date,
                betrag: entry.amount,
                konto: entry.account,
                gegenkonto: '9999',
                buchungstext: entry.description,
                name: entry.mandant,
                belegnummer: entry.document
              });

            if (buchungError) throw buchungError;

            // Add to export list
            const { error: exportError } = await supabase
              .from('export_queue')
              .insert({
                buchung_id: buchungUuid,
                mandant_id: entry.mandantId,
                export_format: 'DATEV'
              });

            if (exportError) throw exportError;

            // Update beleg status to exported
            const { error: updateError } = await supabase
              .from('belege')
              .update({ status: 'exported' })
              .eq('beleg_id', entry.id);

            if (updateError) throw updateError;
          }
        } catch (error) {
          console.error('Error auto-adding high confidence entry:', error);
        }
      }
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

  // Set up real-time updates for belege table
  useEffect(() => {
    const channel = supabase
      .channel('belege-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'belege'
        },
        () => {
          // Refresh data when belege table changes
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
        // Check if buchungshistorie entry already exists
        const { data: existingBuchung } = await supabase
          .from('buchungshistorie')
          .select('buchung_id')
          .eq('buchung_id', entryId)
          .single();

        // Only create buchungshistorie entry if it doesn't exist
        if (!existingBuchung) {
          const { error: buchungError } = await supabase
            .from('buchungshistorie')
            .insert({
              buchung_id: entryId,
              buchungsdatum: approvedEntry.date,
              betrag: approvedEntry.amount,
              konto: approvedEntry.account,
              gegenkonto: '9999', // Default counter account
              buchungstext: approvedEntry.description,
              name: approvedEntry.mandant,
              belegnummer: approvedEntry.document,
              beleg_id: entryId // Store original beleg_id for reference
            });

          if (buchungError) throw buchungError;
        }

        // Check if export queue entry already exists
        const { data: existingExport } = await supabase
          .from('export_queue')
          .select('export_id')
          .eq('buchung_id', entryId)
          .single();

        // Only add to export queue if it doesn't exist
        if (!existingExport) {
          const { error: exportError } = await supabase
            .from('export_queue')
            .insert({
              buchung_id: entryId,
              mandant_id: approvedEntry.mandantId,
              export_format: 'DATEV'
            });

          if (exportError) throw exportError;
        }

        // Update beleg status to approved instead of deleting
        const { error: updateError } = await supabase
          .from('belege')
          .update({ status: 'approved' })
          .eq('beleg_id', entryId);

        if (updateError) throw updateError;

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
      console.error('Error adding to export queue:', error);
      toast({
        title: "Warnung",
        description: "Buchung genehmigt, aber Export-Liste konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (entryId: string) => {
    try {
      // Update beleg status
      const { error } = await supabase
        .from('belege')
        .update({ status: 'rejected' })
        .eq('beleg_id', entryId);

      if (error) throw error;

      // Update local state
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
    } catch (error) {
      console.error('Error rejecting entry:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async (entryId: string, changes: Partial<BookingEntry>) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('belege')
        .update({
          ki_buchungsvorschlag: {
            betrag: changes.amount,
            buchungstext: changes.description,
            konto: changes.account
          },
          belegdatum: changes.date,
          updated_at: new Date().toISOString()
        })
        .eq('beleg_id', entryId);

      if (error) throw error;

      // Update local state
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
      // First delete related entries in export_queue table
      await supabase
        .from('export_queue')
        .delete()
        .eq('buchung_id', entryId);

      // Then delete related entries in buchungshistorie table that reference this beleg
      await supabase
        .from('buchungshistorie')
        .delete()
        .eq('beleg_id', entryId);

      // Also delete buchungshistorie entries that use the entryId as buchung_id
      await supabase
        .from('buchungshistorie')
        .delete()
        .eq('buchung_id', entryId);

      // Finally delete from belege table
      const { error: belegError } = await supabase
        .from('belege')
        .delete()
        .eq('beleg_id', entryId);

      if (belegError) throw belegError;

      // Update local state
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

  return (
    <div className="space-y-6">
      {/* Export List */}
      <ExportList />

      {/* Unified Booking Table */}
      <BookingTable
        entries={filteredEntries}
        mandanten={mandanten}
        selectedMandant={selectedMandant}
        onMandantChange={() => {}} // Handled by parent
        onEntrySelect={setSelectedEntry}
        onApprove={handleApprove}
        onReject={handleReject}
        selectedEntry={selectedEntry}
        confidenceFilter={confidenceFilter}
        onConfidenceFilterChange={setConfidenceFilter}
      />

      {/* Booking Details */}
      <BookingDetails
        selectedEntry={selectedEntry}
        onApprove={handleApprove}
        onReject={handleReject}
        onSaveChanges={handleSaveChanges}
        onDelete={handleDelete}
      />
    </div>
  );
};
