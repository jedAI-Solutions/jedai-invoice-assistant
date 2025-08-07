
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
    approvedBookings: 0,
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
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Entfernen des starken Overlays für bessere Sichtbarkeit des Hintergrunds */}
      <div className="absolute inset-0 bg-black/5" />
      
      {/* Content */}
      <div className="relative z-10">
        <DashboardHeader 
          selectedMandant={selectedMandant}
          onMandantChange={setSelectedMandant}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />
        
        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
          {/* Statistiken Übersicht */}
          <StatsOverview stats={dashboardStats} />
          
          {/* Optimized Layout: Upload smaller, Dashboard full width */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Upload Area - sehr klein */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <UploadArea />
            </div>
            
            {/* Unified Dashboard - maximale Breite */}
            <div className="lg:col-span-4 order-1 lg:order-2">
        <UnifiedDashboard 
          onStatsUpdate={setDashboardStats}
          selectedMandant={selectedMandant}
          selectedTimeframe={selectedTimeframe}
          onMandantChange={setSelectedMandant}
          onRefreshData={() => (window as any).refreshBookingOverview?.()}
        />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
