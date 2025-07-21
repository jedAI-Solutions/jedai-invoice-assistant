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
      {/* Gradient overlay - extra bright white to completely hide logo borders */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40"></div>
      {/* Additional white overlay for logo area */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/100 via-white/80 to-transparent w-1/2"></div>
      <div className="relative z-10 max-w-full mx-auto h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 h-full">
          <div className="flex items-center gap-4 md:gap-8 flex-shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-3 md:gap-6 w-full lg:w-auto justify-center lg:justify-start">
              <div className="flex-shrink-0 relative group cursor-pointer">
                <img 
                  src="/lovable-uploads/c7d57f27-5852-4101-a609-f621974a7b6a.png" 
                  alt="jed AI Solutions Logo" 
                  className="relative h-16 md:h-32 w-auto object-contain transition-all duration-700 ease-in-out
                           hover:scale-105 hover:brightness-110
                           animate-pulse-subtle group-hover:animate-none
                           filter hover:drop-shadow-sm"
                />
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-30 
                              transition-opacity duration-500 ease-in-out
                              bg-gradient-radial from-blue-200/30 via-transparent to-transparent
                              blur-xl scale-150"></div>
              </div>
              <div className="text-center lg:text-left relative group">
                {/* Text shadow for better readability */}
                <h1 className="text-2xl md:text-5xl font-bold bg-gradient-logo bg-clip-text text-transparent font-modern leading-tight pb-2 drop-shadow-lg
                             transition-all duration-500 ease-in-out hover:scale-[1.02] cursor-default">
                  Taxagent
                </h1>
                <p className="text-sm md:text-lg text-gray-800 font-modern font-semibold drop-shadow-md
                             transition-all duration-300 ease-in-out hover:text-gray-600">Powered by jedAI Solutions</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-2 md:gap-4 relative">
            <Badge className="bg-gradient-primary text-white border-0 text-xs md:text-sm shadow-lg">
              KI-System Online
            </Badge>
            <Button variant="outline" className="border-white/50 hover:bg-white/20 text-xs md:text-sm px-2 md:px-4 bg-white/10 backdrop-blur-sm text-gray-800 font-semibold shadow-md">
              Einstellungen
            </Button>
          </div>
        </div>
        
        <div className="mb-4 relative z-10">
          <p className="text-gray-700 text-sm md:text-base text-center lg:text-left font-medium drop-shadow-md">
            Intelligente Belegverarbeitung und Buchungsautomatisierung für Steuerberater
          </p>
        </div>
      </div>
    </div>
  );
};