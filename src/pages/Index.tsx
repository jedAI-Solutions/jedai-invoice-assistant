import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { DashboardStats } from "@/types/booking";
import dashboardBg from "@/assets/dashboard-bg.jpg";

const Index = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalEntries: 0,
    pendingReviews: 0,
    readyForExport: 0,
    rejectedEntries: 0,
    savedTime: 0,
    avgConfidence: 0
  });
  
  const [selectedMandant, setSelectedMandant] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("aktueller-monat");
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay für bessere Lesbarkeit */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      
      {/* Content */}
      <div className="relative z-10">
        <DashboardHeader 
          selectedMandant={selectedMandant}
          onMandantChange={setSelectedMandant}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />
        
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Statistiken Übersicht */}
          <StatsOverview stats={dashboardStats} />
          
          {/* Optimized Layout: Upload smaller, Dashboard full width */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Upload Area - sehr klein */}
            <div className="lg:col-span-1">
              <UploadArea />
            </div>
            
            {/* Unified Dashboard - maximale Breite */}
            <div className="lg:col-span-4">
              <UnifiedDashboard 
                onStatsUpdate={setDashboardStats} 
                selectedMandant={selectedMandant}
                selectedTimeframe={selectedTimeframe}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;