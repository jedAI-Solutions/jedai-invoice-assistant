import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import aiHeaderBg from "@/assets/ai-header-bg.jpg";
import { TransparentLogo } from "@/components/TransparentLogo";
import jedaiLogoIcon from "@/assets/jedai-logo-icon.png";

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
        backgroundSize: '120%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Animated background layer */}
      <div 
        className="absolute inset-0 animate-bg-pan"
        style={{
          backgroundImage: `url(${aiHeaderBg})`,
          backgroundSize: '130%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      <div className="relative z-10 max-w-full mx-auto h-full flex flex-col">
        {/* Main content area with padding for bottom elements */}
        <div className="flex-1 flex items-center justify-center gap-3 md:gap-6 pb-8">
          {/* Logo Container */}
          <div className="flex-shrink-0 relative group cursor-pointer">
            <TransparentLogo
              src={jedaiLogoIcon}
              alt="jedAI Solutions Logo"
              className="relative h-12 md:h-24 w-auto object-contain transition-all duration-700 ease-in-out
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
          
          {/* Text Container */}
          <div className="text-center">
            <h1 className="text-lg md:text-3xl font-bold text-white font-modern leading-tight
                         [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.8)] filter drop-shadow-lg
                         transition-all duration-500 ease-in-out hover:scale-[1.02] cursor-default">
              Taxagent
            </h1>
            <p className="text-xs md:text-sm text-white font-modern font-semibold mt-1
                         [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.9)]
                         transition-all duration-300 ease-in-out hover:text-gray-100">KI-gestützte Belegverarbeitung</p>
          </div>
        </div>

        {/* Action Section - Bottom Right */}
        <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 flex flex-col sm:flex-row items-end gap-2">
          <Badge className="bg-gradient-primary text-white border-0 text-[10px] md:text-xs shadow-lg px-2 py-0.5">
            KI-System Online
          </Badge>
          <Button variant="outline" className="border-white/50 hover:bg-white/20 text-[10px] md:text-xs px-2 py-1
                                             bg-black/20 backdrop-blur-sm text-white font-semibold shadow-md
                                             hover:text-white transition-all duration-300 h-auto">
            Einstellungen
          </Button>
        </div>
      </div>
    </div>
  );
};