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
  status: 'pending' | 'approved' | 'rejected';
}

export const ReviewInterface = () => {
  const [bookings] = useState<BookingEntry[]>([
    {
      id: "1",
      document: "Rechnung_2024_001.pdf",
      date: "2024-01-15",
      amount: 1250.00,
      description: "Büromaterial und Software-Lizenzen",
      account: "6815",
      taxRate: "19%",
      confidence: 94,
      status: 'pending'
    },
    {
      id: "2", 
      document: "Tankbeleg_2024_002.jpg",
      date: "2024-01-14",
      amount: 87.50,
      description: "Kraftstoff Firmenfahrzeug",
      account: "6670",
      taxRate: "19%",
      confidence: 87,
      status: 'pending'
    },
    {
      id: "3",
      document: "Miete_Januar_2024.pdf", 
      date: "2024-01-01",
      amount: 2800.00,
      description: "Büroräume Miete Januar",
      account: "6030",
      taxRate: "0%",
      confidence: 98,
      status: 'approved'
    }
  ]);

  const [selectedBooking, setSelectedBooking] = useState<BookingEntry | null>(bookings[0]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "bg-success text-success-foreground";
    if (confidence >= 85) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Buchungsliste */}
      <Card className="lg:col-span-1 bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Prüfungsliste</span>
            <Badge variant="outline">{bookings.filter(b => b.status === 'pending').length} offen</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedBooking?.id === booking.id ? 'bg-muted border-l-4 border-l-primary' : ''
                }`}
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate flex-1 mr-2">
                    {booking.document}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getConfidenceColor(booking.confidence)}`}
                  >
                    {booking.confidence}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{booking.date}</span>
                  <span className="font-semibold">{formatCurrency(booking.amount)}</span>
                </div>
                <div className="mt-2">
                  <Badge variant={getStatusColor(booking.status) as any} className="text-xs">
                    {booking.status === 'pending' ? 'Prüfung' : 
                     booking.status === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buchungsdetails */}
      <Card className="lg:col-span-2 bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle>Buchungsvorschlag bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedBooking ? (
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
                      defaultValue={selectedBooking.date}
                    />
                  </div>
                  <div>
                    <Label htmlFor="betrag">Betrag</Label>
                    <Input 
                      id="betrag" 
                      type="number" 
                      step="0.01"
                      defaultValue={selectedBooking.amount}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="beschreibung">Buchungstext</Label>
                  <Input 
                    id="beschreibung" 
                    defaultValue={selectedBooking.description}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="konto">SKR-Konto</Label>
                    <Select defaultValue={selectedBooking.account}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6815">6815 - Büromaterial</SelectItem>
                        <SelectItem value="6670">6670 - Fahrzeugkosten</SelectItem>
                        <SelectItem value="6030">6030 - Mieten</SelectItem>
                        <SelectItem value="6200">6200 - Werbekosten</SelectItem>
                        <SelectItem value="6300">6300 - Bewirtung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="steuer">Steuersatz</Label>
                    <Select defaultValue={selectedBooking.taxRate}>
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

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm">
                    KI-Konfidenz: <strong>{selectedBooking.confidence}%</strong> - 
                    {selectedBooking.confidence >= 90 ? ' Sehr zuverlässig' : 
                     selectedBooking.confidence >= 80 ? ' Zuverlässig' : ' Prüfung empfohlen'}
                  </span>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">
                    Buchung genehmigen
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Änderungen speichern
                  </Button>
                  <Button variant="destructive">
                    Ablehnen
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="beleg" className="mt-6">
                <div className="border rounded-lg p-6 bg-muted/30 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{selectedBooking.document}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Belegvorschau wird hier angezeigt
                      </p>
                    </div>
                    <Button variant="outline">
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
  );
};