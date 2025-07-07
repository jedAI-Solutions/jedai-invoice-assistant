import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgendaEntry {
  id: string;
  document: string;
  date: string;
  amount: number;
  description: string;
  account: string;
  taxRate: string;
  confidence: number;
  status: 'ready' | 'exported' | 'corrected';
}

export const AgendaInterface = () => {
  const [agendaEntries] = useState<AgendaEntry[]>([
    {
      id: "1",
      document: "Stromrechnung_Dezember_2024.pdf",
      date: "2024-12-15",
      amount: 420.50,
      description: "Stromkosten Büroräume Dezember",
      account: "6400",
      taxRate: "19%",
      confidence: 96,
      status: 'ready'
    },
    {
      id: "2", 
      document: "Lieferant_ABC_Rechnung_456.pdf",
      date: "2024-12-14",
      amount: 1890.00,
      description: "Büroausstattung und IT-Equipment",
      account: "6815",
      taxRate: "19%",
      confidence: 94,
      status: 'ready'
    },
    {
      id: "3",
      document: "Telefon_Internet_Dezember.pdf", 
      date: "2024-12-01",
      amount: 89.99,
      description: "Telefon- und Internetkosten",
      account: "6320",
      taxRate: "19%",
      confidence: 98,
      status: 'exported'
    },
    {
      id: "4",
      document: "Versicherung_Betrieb_Q4.pdf", 
      date: "2024-12-10",
      amount: 650.00,
      description: "Betriebshaftpflichtversicherung Q4",
      account: "6720",
      taxRate: "19%",
      confidence: 91,
      status: 'ready'
    }
  ]);

  const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(agendaEntries[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exported': return 'default';
      case 'corrected': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exported': return 'Exportiert';
      case 'corrected': return 'Korrigiert';
      default: return 'Bereit';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const readyEntries = agendaEntries.filter(e => e.status === 'ready');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agenda Import</h2>
          <p className="text-muted-foreground">Positive Liste - Hochkonfidente Buchungen für Export</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white/10 backdrop-blur-glass border-white/20">
            Alle als Agenda exportieren
          </Button>
          <Button className="bg-gradient-primary text-white border-0">
            Ausgewählte exportieren ({readyEntries.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda Liste */}
        <Card className="lg:col-span-1 bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass hover:shadow-strong transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Export-Liste</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {readyEntries.length} bereit
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {agendaEntries.map((entry) => (
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
                      className="text-xs bg-success/10 text-success border-success/20"
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

        {/* Buchungsdetails */}
        <Card className="lg:col-span-2 bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass hover:shadow-strong transition-all duration-300">
          <CardHeader>
            <CardTitle>Buchung überprüfen & exportieren</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEntry ? (
              <Tabs defaultValue="buchung" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buchung">Buchungsdaten</TabsTrigger>
                  <TabsTrigger value="beleg">Belegansicht</TabsTrigger>
                </TabsList>
                
                <TabsContent value="buchung" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="datum">Belegdatum</Label>
                      <Input 
                        id="datum" 
                        type="date" 
                        value={selectedEntry.date}
                        onChange={() => {}}
                      />
                    </div>
                    <div>
                      <Label htmlFor="betrag">Betrag</Label>
                      <Input 
                        id="betrag" 
                        type="number" 
                        step="0.01"
                        value={selectedEntry.amount}
                        onChange={() => {}}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="beschreibung">Buchungstext</Label>
                    <Input 
                      id="beschreibung" 
                      value={selectedEntry.description}
                      onChange={() => {}}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="konto">SKR-Konto</Label>
                      <Select value={selectedEntry.account}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6400">6400 - Strom/Gas/Wasser</SelectItem>
                          <SelectItem value="6815">6815 - Büromaterial</SelectItem>
                          <SelectItem value="6320">6320 - Kommunikation</SelectItem>
                          <SelectItem value="6720">6720 - Versicherungen</SelectItem>
                          <SelectItem value="6200">6200 - Werbekosten</SelectItem>
                          <SelectItem value="6300">6300 - Bewirtung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="steuer">Steuersatz</Label>
                      <Select value={selectedEntry.taxRate}>
                        <SelectTrigger>
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

                  <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-sm">
                      KI-Konfidenz: <strong>{selectedEntry.confidence}%</strong> - Exportbereit
                    </span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-gradient-primary text-white border-0">
                      Als Agenda exportieren
                    </Button>
                    <Button variant="outline" className="flex-1 bg-white/10 backdrop-blur-glass border-white/20">
                      Korrektion speichern
                    </Button>
                    <Button variant="outline" className="bg-white/10 backdrop-blur-glass border-white/20">
                      Zur Prüfung
                    </Button>
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
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Wählen Sie eine Buchung zur Bearbeitung aus</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};