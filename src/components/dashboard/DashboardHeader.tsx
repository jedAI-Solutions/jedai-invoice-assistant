import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, User, Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, signOut, isAdmin } = useAuth();
  const currentTab = location.pathname === '/agenda-import' ? 'agenda' : 'review';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  return (
    <div 
      className="relative bg-glass backdrop-blur-glass shadow-glass border-b border-glass p-4 md:p-8 min-h-[120px] md:min-h-[160px] overflow-hidden"
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
            <img
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
              TaxAgent
            </h1>
            <p className="text-xs md:text-sm text-white font-modern font-semibold mt-1
                         [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.9)]
                         transition-all duration-300 ease-in-out hover:text-gray-100">KI-gestützte Belegverarbeitung</p>
          </div>
        </div>

        {/* Action Section - Centered Bottom */}
        <div className="flex flex-row items-center justify-between gap-2 mt-2">
          <Badge className="bg-gradient-primary text-white border-0 text-[10px] md:text-xs shadow-lg px-2 py-0.5">
            KI-System Online
          </Badge>
          
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-glass bg-glass backdrop-blur-md border-glass shadow-lg">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/98 backdrop-blur-md border-white/50 shadow-xl z-50">
                <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                {isAdmin() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Administration</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                      <Users className="mr-2 h-4 w-4" />
                      Benutzerverwaltung
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};