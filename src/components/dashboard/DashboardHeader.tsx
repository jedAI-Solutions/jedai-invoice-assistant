import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";

export const DashboardHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentTab = location.pathname === '/agenda-import' ? 'agenda' : 'review';
  return (
    <div className="bg-white/10 backdrop-blur-glass shadow-glass border-b border-white/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/c7d57f27-5852-4101-a609-f621974a7b6a.png" 
                alt="jed AI Solutions Logo" 
                className="h-20 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-logo bg-clip-text text-transparent">
                  Taxagent
                </h1>
                <p className="text-base text-muted-foreground mt-1">Powered by jed AI Solutions</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-primary text-white border-0">
              KI-System Online
            </Badge>
            <Button variant="outline" className="border-primary/30 hover:bg-primary/5">
              Einstellungen
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-muted-foreground">
            Intelligente Belegverarbeitung und Buchungsautomatisierung für Steuerberater
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="mb-6">
          <Tabs value={currentTab} onValueChange={(value) => {
            if (value === 'agenda') {
              navigate('/agenda-import');
            } else {
              navigate('/');
            }
          }}>
            <TabsList className="bg-white/10 backdrop-blur-glass border border-white/20">
              <TabsTrigger value="review" className="data-[state=active]:bg-white/20">
                Prüfungsliste (Konfidenz &lt; 80%)
              </TabsTrigger>
              <TabsTrigger value="agenda" className="data-[state=active]:bg-white/20">
                Agenda Import (Konfidenz ≥ 80%)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Mandant:</span>
            <Select defaultValue="mustermann-gmbh">
              <SelectTrigger className="w-64 bg-white/10 backdrop-blur-glass border-white/20">
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
              <SelectTrigger className="w-48 bg-white/10 backdrop-blur-glass border-white/20">
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