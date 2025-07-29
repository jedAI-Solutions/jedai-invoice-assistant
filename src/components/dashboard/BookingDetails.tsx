import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookingEntry } from "@/types/booking";
import { supabase } from "@/integrations/supabase/client";
import type { Mandantenstammdaten } from "@/types/mandantenstammdaten";

type Mandant = Pick<Mandantenstammdaten, 'name1' | 'mandant_nr'>;

interface BookingDetailsProps {
  selectedEntry: BookingEntry | null;
  onApprove: (entryId: string) => void;
  onReject: (entryId: string) => void;
  onSaveChanges: (entryId: string, changes: Partial<BookingEntry>) => void;
  onDelete?: (entryId: string) => void;
}

export const BookingDetails = ({
  selectedEntry,
  onApprove,
  onReject,
  onSaveChanges,
  onDelete
}: BookingDetailsProps) => {
  const [editedEntry, setEditedEntry] = useState<BookingEntry | null>(null);
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [loadingMandanten, setLoadingMandanten] = useState(false);

  // Lade Mandanten beim Komponenten-Start
  useEffect(() => {
    loadMandanten();
  }, []);

  useEffect(() => {
    setEditedEntry(selectedEntry);
  }, [selectedEntry]);

  const loadMandanten = async () => {
    setLoadingMandanten(true);
    try {
      // Temporarily disabled - no database integration
      setMandanten([]);
      setLoadingMandanten(false);
    } catch (error) {
      console.error('Error loading mandanten:', error);
    } finally {
      setLoadingMandanten(false);
    }
  };
  if (!selectedEntry || !editedEntry) {
    return (
      <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Wählen Sie eine Buchung zur Bearbeitung aus</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = () => {
    if (selectedEntry.status === 'pending' || selectedEntry.status === 'rejected') {
      return 'bg-warning/10 text-warning border-warning/20';
    }
    return 'bg-success/10 text-success border-success/20';
  };

  const getStatusText = () => {
    if (selectedEntry.status === 'pending' || selectedEntry.status === 'rejected') {
      return 'Prüfung erforderlich';
    }
    return 'Exportbereit';
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass hover:shadow-strong transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Buchungsdetails</span>
          <Badge variant="outline" className={getStatusBadgeVariant()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buchung" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-glass border border-white/20">
            <TabsTrigger value="buchung" className="data-[state=active]:bg-white/20">Buchungsdaten</TabsTrigger>
            <TabsTrigger value="beleg" className="data-[state=active]:bg-white/20">Belegansicht</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buchung" className="space-y-6">
            {/* KI-Entscheidungsgrundlage */}
            <div className="p-4 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                  <span className="text-sm text-white font-bold">KI</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">KI-Entscheidungsgrundlage</h4>
                  <p className="text-sm text-muted-foreground">Begründung für die automatische Klassifizierung</p>
                </div>
              </div>
              <div className="ml-11 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedEntry.aiReasoning || "Basierend auf dem Beleginhalt wurde eine automatische Kategorisierung vorgenommen. Die KI hat Datum, Betrag und Beschreibung analysiert und entsprechend dem Wahrscheinlichkeitsmodell klassifiziert."}
                </p>
              </div>
            </div>

            {/* KI-Prüfhinweise */}
            {selectedEntry.aiHints && selectedEntry.aiHints.length > 0 && (
              <div className="p-4 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-warning/80 flex items-center justify-center">
                    <span className="text-sm text-white font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">KI-Prüfhinweise</h4>
                    <p className="text-sm text-muted-foreground">Wichtige Hinweise zur manuellen Überprüfung</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-11">
                  {selectedEntry.aiHints.map((hint, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-warning mt-1 text-sm">•</span>
                      <span className="text-sm text-foreground">{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="datum">Belegdatum</Label>
                  <Input 
                    id="datum" 
                    type="date" 
                    value={editedEntry.date}
                    onChange={(e) => setEditedEntry(prev => prev ? {...prev, date: e.target.value} : null)}
                    className="bg-white/10 backdrop-blur-glass border-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="betrag">Betrag</Label>
                  <Input 
                    id="betrag" 
                    type="number" 
                    step="0.01"
                    value={editedEntry.amount}
                    onChange={(e) => setEditedEntry(prev => prev ? {...prev, amount: parseFloat(e.target.value)} : null)}
                    className="bg-white/10 backdrop-blur-glass border-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="beschreibung">Buchungstext</Label>
                  <Input 
                    id="beschreibung" 
                    value={editedEntry.description}
                    onChange={(e) => setEditedEntry(prev => prev ? {...prev, description: e.target.value} : null)}
                    className="bg-white/10 backdrop-blur-glass border-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="mandant">Mandant *</Label>
                  <Select 
                    value={editedEntry.mandant || ""} 
                    onValueChange={(value) => {
                      const selectedMandant = mandanten.find(m => m.name1 === value);
                      setEditedEntry(prev => prev ? {
                        ...prev, 
                        mandant: value,
                        mandantId: selectedMandant?.mandant_nr || value
                      } : null);
                    }}
                    disabled={loadingMandanten}
                    required
                  >
                    <SelectTrigger className="bg-white border border-gray-300 hover:bg-gray-50">
                      <SelectValue placeholder={loadingMandanten ? "Lade Mandanten..." : "Mandant auswählen..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
                      <SelectItem 
                        value="nicht-definiert"
                        className="hover:bg-gray-100 cursor-pointer text-gray-600 italic"
                      >
                        Nicht definiert
                      </SelectItem>
                      {mandanten.map((mandant) => (
                        <SelectItem 
                          key={mandant.name1} 
                          value={mandant.name1 || ""}
                          className="hover:bg-gray-100 cursor-pointer"
                        >
                          {mandant.name1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!editedEntry.mandant || editedEntry.mandant === 'nicht-definiert') && (
                    <p className="text-xs text-warning mt-1">
                      {editedEntry.mandant === 'nicht-definiert' ? 'Mandant nicht definiert' : 'Mandant ist erforderlich'}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="konto">SKR-Konto</Label>
                  <Select value={editedEntry.account} onValueChange={(value) => setEditedEntry(prev => prev ? {...prev, account: value} : null)}>
                    <SelectTrigger className="bg-white/10 backdrop-blur-glass border-white/20">
                      <SelectValue placeholder="SKR-Konto auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4900">4900 - Sonstige Erträge</SelectItem>
                      <SelectItem value="4930">4930 - Dienstleistungserträge</SelectItem>
                      <SelectItem value="6030">6030 - Mieten</SelectItem>
                      <SelectItem value="6200">6200 - Werbekosten</SelectItem>
                      <SelectItem value="6300">6300 - Bewirtung</SelectItem>
                      <SelectItem value="6320">6320 - Kommunikation</SelectItem>
                      <SelectItem value="6400">6400 - Strom/Gas/Wasser</SelectItem>
                      <SelectItem value="6670">6670 - Fahrzeugkosten</SelectItem>
                      <SelectItem value="6720">6720 - Versicherungen</SelectItem>
                      <SelectItem value="6815">6815 - Büromaterial</SelectItem>
                      <SelectItem value="8400">8400 - Erlöse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="steuer">Steuersatz</Label>
                  <Select value={editedEntry.taxRate} onValueChange={(value) => setEditedEntry(prev => prev ? {...prev, taxRate: value} : null)}>
                    <SelectTrigger className="bg-white/10 backdrop-blur-glass border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="19%">19% - Regelsteuersatz</SelectItem>
                      <SelectItem value="7%">7% - Ermäßigter Satz</SelectItem>
                      <SelectItem value="0%">0% - Steuerfrei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Konfidenz-Anzeige */}
                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
                  <div className={`w-3 h-3 rounded-full ${selectedEntry.confidence >= 80 ? 'bg-success' : selectedEntry.confidence >= 70 ? 'bg-warning' : 'bg-destructive'}`}></div>
                  <span className="text-sm">
                    KI-Konfidenz: <strong>{selectedEntry.confidence}%</strong> - 
                    {selectedEntry.confidence >= 90 ? ' Sehr zuverlässig' : 
                     selectedEntry.confidence >= 80 ? ' Exportbereit' :
                     selectedEntry.confidence >= 70 ? ' Zuverlässig' : ' Prüfung empfohlen'}
                  </span>
                </div>
              </div>
            </div>

            {/* Aktionsbuttons - Nur drei Optionen für Einträge mit Status "pending" */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sticky bottom-0 bg-background/95 backdrop-blur-sm p-3 -mx-3 -mb-3 rounded-b-lg border-t border-white/10">
              <Button 
                className="w-full sm:flex-1 bg-gradient-primary text-white border-0 h-10"
                onClick={() => onApprove(selectedEntry.id)}
              >
                Genehmigen
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:flex-1 bg-white/10 backdrop-blur-glass border-white/20 h-10"
                onClick={() => onSaveChanges(selectedEntry.id, editedEntry)}
              >
                Korrekturen speichern
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="w-full sm:w-auto h-10"
                  >
                    Löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gradient-card backdrop-blur-glass border-white/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eintrag löschen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sind Sie sicher, dass Sie diesen Buchungseintrag permanent löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/10 backdrop-blur-glass border-white/20">
                      Abbrechen
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground"
                      onClick={() => onDelete?.(selectedEntry.id)}
                    >
                      Endgültig löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
          
          <TabsContent value="beleg" className="mt-6">
            <div className="border border-white/20 rounded-lg p-6 bg-white/10 backdrop-blur-glass text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{selectedEntry.document}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Belegvorschau wird hier angezeigt
                  </p>
                </div>
                <Button variant="outline" className="bg-white/10 backdrop-blur-glass border-white/20">
                  Beleg öffnen
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};