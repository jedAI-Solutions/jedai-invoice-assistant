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
    totalAmount: 0,
    avgConfidence: 0
  });
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
        <DashboardHeader />
        
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Statistiken Übersicht */}
          <StatsOverview stats={dashboardStats} />
          
          {/* Layout: Upload (klein) + Unified Dashboard */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Upload Area - kleiner */}
            <div className="xl:col-span-1">
              <UploadArea />
            </div>
            
            {/* Unified Dashboard */}
            <div className="xl:col-span-3">
              <UnifiedDashboard onStatsUpdate={setDashboardStats} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;