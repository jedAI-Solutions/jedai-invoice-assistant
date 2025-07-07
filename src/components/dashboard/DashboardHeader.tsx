import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const DashboardHeader = () => {
  return (
    <div className="bg-card shadow-soft border-b p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Steuerberater Dashboard</h1>
            <p className="text-muted-foreground">Intelligente Belegverarbeitung und Buchungsautomatisierung</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-success text-success-foreground">
              System Online
            </Badge>
            <Button variant="outline">Einstellungen</Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Mandant:</span>
            <Select defaultValue="mustermann-gmbh">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mustermann-gmbh">Mustermann GmbH</SelectItem>
                <SelectItem value="schmidt-kg">Schmidt & Co KG</SelectItem>
                <SelectItem value="weber-einzelunternehmen">Weber Einzelunternehmen</SelectItem>
                <SelectItem value="alle-mandanten">Alle Mandanten</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Zeitraum:</span>
            <Select defaultValue="aktueller-monat">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heute">Heute</SelectItem>
                <SelectItem value="diese-woche">Diese Woche</SelectItem>
                <SelectItem value="aktueller-monat">Aktueller Monat</SelectItem>
                <SelectItem value="letzter-monat">Letzter Monat</SelectItem>
                <SelectItem value="quartal">Aktuelles Quartal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};