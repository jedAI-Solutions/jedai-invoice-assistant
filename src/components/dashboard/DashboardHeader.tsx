import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import aiHeaderBg from "@/assets/ai-header-bg.jpg";

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
    <div 
      className="relative bg-white/10 backdrop-blur-glass shadow-glass border-b border-white/20 p-4 md:p-8 min-h-[120px] md:min-h-[160px] overflow-hidden"
      style={{
        backgroundImage: `url(${aiHeaderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-full mx-auto h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 h-full">
          <div className="flex items-center gap-4 md:gap-8 flex-shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-3 md:gap-6 w-full lg:w-auto justify-center lg:justify-start">
              <div className="flex-shrink-0">
                <img 
                  src="/lovable-uploads/c7d57f27-5852-4101-a609-f621974a7b6a.png" 
                  alt="jed AI Solutions Logo" 
                  className="h-12 md:h-24 w-auto drop-shadow-xl object-contain"
                />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-2xl md:text-5xl font-bold bg-gradient-logo bg-clip-text text-transparent font-modern leading-tight pb-2">
                  Taxagent
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground font-modern">Powered by jedAI Solutions</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <Badge className="bg-gradient-primary text-white border-0 text-xs md:text-sm">
              KI-System Online
            </Badge>
            <Button variant="outline" className="border-primary/30 hover:bg-primary/5 text-xs md:text-sm px-2 md:px-4">
              Einstellungen
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-muted-foreground text-sm md:text-base text-center md:text-left">
            Intelligente Belegverarbeitung und Buchungsautomatisierung für Steuerberater
          </p>
        </div>
      </div>
    </div>
  );
};