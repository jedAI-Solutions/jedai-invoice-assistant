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
import { PDFViewer } from "./PDFViewer";

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
  const [accounts, setAccounts] = useState<{account_number: string, account_name: string}[]>([]);
  const [loadingMandanten, setLoadingMandanten] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Lade Mandanten und Konten beim Komponenten-Start
  useEffect(() => {
    loadMandanten();
    loadAccounts();
  }, []);

  useEffect(() => {
    console.log('BookingDetails: selectedEntry changed', selectedEntry?.id, selectedEntry?.account, selectedEntry?.taxRate);
    setEditedEntry(selectedEntry);
  }, [selectedEntry]);

  const loadMandanten = async () => {
    setLoadingMandanten(true);
    try {
      const { data, error } = await supabase
        .from('mandants')
        .select('name1, mandant_nr')
        .eq('status', 'active')
        .order('name1');

      if (error) throw error;

      setMandanten(data || []);
    } catch (error) {
      console.error('Error loading mandanten:', error);
      setMandanten([]);
    } finally {
      setLoadingMandanten(false);
    }
  };

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_number, account_name')
        .eq('is_active', true)
        .order('account_number');

      if (error) throw error;

      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const downloadDocument = async (documentUrl: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(documentUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const openDocumentInNewTab = async (documentUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(documentUrl, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };
  if (!selectedEntry || !editedEntry) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
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
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
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
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-glass border border-white/20">
            <TabsTrigger value="buchung" className="data-[state=active]:bg-white/20">Buchungsdaten</TabsTrigger>
            <TabsTrigger value="beleg" className="data-[state=active]:bg-white/20">Belegansicht</TabsTrigger>
            <TabsTrigger value="pdf" className="data-[state=active]:bg-white/20">Original PDF</TabsTrigger>
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
                    <SelectTrigger className="bg-white/95 backdrop-blur-md border-white/30 hover:bg-white shadow-lg">
                      <SelectValue placeholder={loadingMandanten ? "Lade Mandanten..." : "Mandant auswählen..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/98 backdrop-blur-md border-white/50 shadow-xl z-50">
                      <SelectItem 
                        value="nicht-definiert"
                        className="hover:bg-gray-100 cursor-pointer text-gray-600 italic"
                      >
                        Nicht definiert
                      </SelectItem>
                      {mandanten.map((mandant) => (
                        <SelectItem 
                          key={mandant.mandant_nr} 
                          value={mandant.name1 || ""}
                          className="hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>{mandant.name1}</span>
                            <span className="text-xs text-gray-500 ml-2">({mandant.mandant_nr})</span>
                          </div>
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
                  <Select 
                    key={`account-${selectedEntry.id}`}
                    value={editedEntry.account} 
                    onValueChange={(value) => setEditedEntry(prev => prev ? {...prev, account: value} : null)}
                    disabled={loadingAccounts}
                  >
                    <SelectTrigger className="bg-white/95 backdrop-blur-md border-white/30 hover:bg-white shadow-lg">
                      <SelectValue placeholder={loadingAccounts ? "Lade Konten..." : "SKR-Konto auswählen"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/98 backdrop-blur-md border-white/50 shadow-xl z-50">
                      {accounts.map((account) => (
                        <SelectItem 
                          key={account.account_number} 
                          value={account.account_number}
                          className="hover:bg-gray-100 cursor-pointer"
                        >
                          {account.account_number} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="steuer">Steuersatz</Label>
                  <Select 
                    key={`taxrate-${selectedEntry.id}`}
                    value={editedEntry.taxRate} 
                    onValueChange={(value) => setEditedEntry(prev => prev ? {...prev, taxRate: value} : null)}
                  >
                    <SelectTrigger className="bg-white/95 backdrop-blur-md border-white/30 hover:bg-white shadow-lg">
                      <SelectValue placeholder="Steuersatz auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/98 backdrop-blur-md border-white/50 shadow-xl z-50">
                      <SelectItem value="19%">19% - Regelsteuersatz</SelectItem>
                      <SelectItem value="9%">9% - Ermäßigter Satz (Bücher etc.)</SelectItem>
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
          
          <TabsContent value="pdf" className="mt-6">
            <div className="border border-white/20 rounded-lg p-6 bg-white/10 backdrop-blur-glass">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-foreground mb-2">{selectedEntry.document}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Original PDF-Dokument
                  </p>
                  {selectedEntry.document_url ? (
                    <div className="space-y-3">
                      <PDFViewer documentUrl={selectedEntry.document_url} />
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          className="bg-white/10 backdrop-blur-glass border-white/20"
                          onClick={() => downloadDocument(selectedEntry.document_url!, selectedEntry.document)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF herunterladen
                        </Button>
                        <Button 
                          variant="outline" 
                          className="bg-white/10 backdrop-blur-glass border-white/20"
                          onClick={() => openDocumentInNewTab(selectedEntry.document_url!)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          In neuem Tab öffnen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm mb-4">
                        Kein Originaldokument verfügbar
                      </p>
                      <Button 
                        variant="outline" 
                        className="bg-white/10 backdrop-blur-glass border-white/20"
                        disabled
                      >
                        Dokument nicht verfügbar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};