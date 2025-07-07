import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BookingEntry {
  id: string;
  document: string;
  date: string;
  amount: number;
  description: string;
  account: string;
  taxRate: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'ready' | 'exported' | 'corrected';
  listType: 'review' | 'agenda';
  aiHints?: string[];
}

export const CombinedInterface = () => {
  // Prüfungsliste - Konfidenz < 80%
  const reviewEntries: BookingEntry[] = [
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
      listType: 'review',
      aiHints: ["Prüfen Sie die Zuordnung zu 6815", "Betrag erscheint ungewöhnlich hoch", "Rechnungsdatum prüfen"]
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
      listType: 'review',
      aiHints: ["Belegqualität niedrig", "Fahrtzweck unklar", "Kilometerstand nicht erkennbar"]
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
      listType: 'review',
      aiHints: ["Teilnehmer nicht erkennbar", "Geschäftlicher Anlass unklar", "Bewirtungsnachweis unvollständig"]
    }
  ];

  // Agenda Import - Konfidenz >= 80%
  const agendaEntries: BookingEntry[] = [
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
      listType: 'agenda',
      aiHints: ["Automatische Erkennung erfolgreich", "Alle Daten vollständig", "Exportbereit"]
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
      listType: 'agenda',
      aiHints: ["Lieferant bekannt", "Standard-Buchung", "Keine Korrekturen nötig"]
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
      status: 'exported',
      listType: 'agenda',
      aiHints: ["Bereits exportiert", "Monatlicher Standardposten", "Vollautomatisch verarbeitet"]
    }
  ];

  const [selectedEntry, setSelectedEntry] = useState<BookingEntry | null>(reviewEntries[0]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-success text-success-foreground";
    if (confidence >= 80) return "bg-success/80 text-success-foreground";
    if (confidence >= 70) return "bg-warning text-warning-foreground";
    if (confidence >= 50) return "bg-warning/80 text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'exported': return 'default';
      case 'rejected': return 'destructive';
      case 'corrected': return 'warning';
      case 'ready': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'exported': return 'Exportiert';
      case 'rejected': return 'Abgelehnt';
      case 'corrected': return 'Korrigiert';
      case 'ready': return 'Bereit';
      default: return 'Prüfung';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderBookingList = (entries: BookingEntry[], title: string, badgeText: string, badgeVariant: string) => (
    <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass hover:shadow-strong transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline" className={badgeVariant}>
            {badgeText}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-300 ${
                selectedEntry?.id === entry.id ? 'bg-white/15 border-l-4 border-l-primary backdrop-blur-glass' : 'hover:backdrop-blur-glass'
              }`}
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm truncate flex-1 mr-2">
                  {entry.document}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getConfidenceColor(entry.confidence)}`}
                >
                  {entry.confidence}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{entry.date}</span>
                <span className="font-semibold">{formatCurrency(entry.amount)}</span>
              </div>
              <div className="mt-2">
                <Badge variant={getStatusColor(entry.status) as any} className="text-xs">
                  {getStatusText(entry.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const getActionButtons = () => {
    if (!selectedEntry) return null;

    if (selectedEntry.listType === 'review') {
      return (
        <div className="flex gap-3 pt-4">
          <Button className="flex-1 bg-gradient-primary text-white border-0">
            Buchung genehmigen
          </Button>
          <Button variant="outline" className="flex-1 bg-white/10 backdrop-blur-glass border-white/20">
            Änderungen speichern
          </Button>
          <Button variant="destructive">
            Ablehnen
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex gap-3 pt-4">
          <Button className="flex-1 bg-gradient-primary text-white border-0">
            Als Agenda exportieren
          </Button>
          <Button variant="outline" className="flex-1 bg-white/10 backdrop-blur-glass border-white/20">
            Korrektion speichern
          </Button>
          <Button variant="outline" className="bg-white/10 backdrop-blur-glass border-white/20">
            Zur Prüfung verschieben
          </Button>
        </div>
      );
    }
  };

  const pendingReviews = reviewEntries.filter(e => e.status === 'pending').length;
  const readyExports = agendaEntries.filter(e => e.status === 'ready').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Prüfungsliste */}
      <div className="lg:col-span-2">
        {renderBookingList(
          reviewEntries, 
          "Prüfungsliste", 
          `${pendingReviews} offen`, 
          "bg-warning/10 text-warning border-warning/20"
        )}
      </div>

      {/* Gemeinsame Buchungsvorschlag Maske - IN DER MITTE */}
      <Card className="lg:col-span-1 bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass hover:shadow-strong transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Buchungsvorschlag</span>
            {selectedEntry && (
              <Badge variant="outline" className={selectedEntry.listType === 'review' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}>
                {selectedEntry.listType === 'review' ? 'Prüfung' : 'Export'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {selectedEntry ? (
            <div className="space-y-4">
              {/* KI-Prüfhinweise */}
              {selectedEntry.aiHints && selectedEntry.aiHints.length > 0 && (
                <div className="p-3 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center mt-0.5">
                      <span className="text-xs text-white font-bold">KI</span>
                    </div>
                    <span className="text-sm font-medium">Prüfhinweise:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-6">
                    {selectedEntry.aiHints.map((hint, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-primary mt-1">•</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Kompakte Buchungsdaten */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="datum" className="text-xs">Belegdatum</Label>
                  <Input 
                    id="datum" 
                    type="date" 
                    value={selectedEntry.date}
                    onChange={() => {}}
                    className="bg-white/10 backdrop-blur-glass border-white/20 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="betrag" className="text-xs">Betrag</Label>
                  <Input 
                    id="betrag" 
                    type="number" 
                    step="0.01"
                    value={selectedEntry.amount}
                    onChange={() => {}}
                    className="bg-white/10 backdrop-blur-glass border-white/20 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="beschreibung" className="text-xs">Buchungstext</Label>
                  <Input 
                    id="beschreibung" 
                    value={selectedEntry.description}
                    onChange={() => {}}
                    className="bg-white/10 backdrop-blur-glass border-white/20 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="konto" className="text-xs">SKR-Konto</Label>
                  <Select value={selectedEntry.account}>
                    <SelectTrigger className="bg-white/10 backdrop-blur-glass border-white/20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6400">6400 - Strom/Gas/Wasser</SelectItem>
                      <SelectItem value="6815">6815 - Büromaterial</SelectItem>
                      <SelectItem value="6320">6320 - Kommunikation</SelectItem>
                      <SelectItem value="6670">6670 - Fahrzeugkosten</SelectItem>
                      <SelectItem value="6030">6030 - Mieten</SelectItem>
                      <SelectItem value="6720">6720 - Versicherungen</SelectItem>
                      <SelectItem value="6200">6200 - Werbekosten</SelectItem>
                      <SelectItem value="6300">6300 - Bewirtung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="steuer" className="text-xs">Steuersatz</Label>
                  <Select value={selectedEntry.taxRate}>
                    <SelectTrigger className="bg-white/10 backdrop-blur-glass border-white/20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="19%">19% - Regelsteuersatz</SelectItem>
                      <SelectItem value="7%">7% - Ermäßigter Satz</SelectItem>
                      <SelectItem value="0%">0% - Steuerfrei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Konfidenz-Anzeige */}
              <div className="flex items-center gap-2 p-2 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
                <div className={`w-2 h-2 rounded-full ${selectedEntry.confidence >= 80 ? 'bg-success' : selectedEntry.confidence >= 70 ? 'bg-warning' : 'bg-destructive'}`}></div>
                <span className="text-xs">
                  <strong>{selectedEntry.confidence}%</strong> - 
                  {selectedEntry.confidence >= 90 ? ' Sehr zuverlässig' : 
                   selectedEntry.confidence >= 80 ? ' Exportbereit' :
                   selectedEntry.confidence >= 70 ? ' Zuverlässig' : ' Prüfung empfohlen'}
                </span>
              </div>

              {/* Kompakte Aktionsbuttons */}
              <div className="space-y-2">
                {selectedEntry.listType === 'review' ? (
                  <>
                    <Button size="sm" className="w-full bg-gradient-primary text-white border-0 h-8 text-xs">
                      Genehmigen
                    </Button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-white/10 backdrop-blur-glass border-white/20 h-8 text-xs">
                        Speichern
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8 text-xs">
                        Ablehnen
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button size="sm" className="w-full bg-gradient-primary text-white border-0 h-8 text-xs">
                      Exportieren
                    </Button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-white/10 backdrop-blur-glass border-white/20 h-8 text-xs">
                        Korrigieren
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white/10 backdrop-blur-glass border-white/20 h-8 text-xs">
                        → Prüfung
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">Buchung auswählen</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda Import Liste */}
      <div className="lg:col-span-2">
        {renderBookingList(
          agendaEntries, 
          "Agenda Import", 
          `${readyExports} bereit`, 
          "bg-success/10 text-success border-success/20"
        )}
      </div>
    </div>
  );
};