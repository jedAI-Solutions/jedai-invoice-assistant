import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  selectedMandant: string;
  onMandantChange: (mandant: string) => void;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export const DashboardHeader = ({ 
  selectedMandant, 
  onMandantChange, 
  selectedTimeframe, 
  onTimeframeChange 
}: DashboardHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentTab = location.pathname === '/agenda-import' ? 'agenda' : 'review';
  return (
    <div className="bg-white/10 backdrop-blur-glass shadow-glass border-b border-white/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6">
              <img 
                src="/lovable-uploads/c7d57f27-5852-4101-a609-f621974a7b6a.png" 
                alt="jed AI Solutions Logo" 
                className="h-24 w-auto drop-shadow-xl"
              />
              <div>
                <h1 className="text-5xl font-bold bg-gradient-logo bg-clip-text text-transparent font-modern">
                  Taxagent
                </h1>
                <p className="text-lg text-muted-foreground mt-1 font-modern">Powered by jedAI Solutions</p>
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
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground font-modern">Mandant:</span>
            <Select value={selectedMandant} onValueChange={onMandantChange}>
              <SelectTrigger className="w-64 bg-white/10 backdrop-blur-glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mandanten</SelectItem>
                <SelectItem value="m1">Mustermann GmbH</SelectItem>
                <SelectItem value="m2">Beispiel AG</SelectItem>
                <SelectItem value="m3">Demo KG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground font-modern">Zeitraum:</span>
            <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
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