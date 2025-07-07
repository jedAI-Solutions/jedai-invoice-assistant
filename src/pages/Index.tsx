import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { CombinedInterface } from "@/components/dashboard/CombinedInterface";
import dashboardBg from "@/assets/dashboard-bg.jpg";

const Index = () => {
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
          <StatsOverview />
          
          {/* Layout: Upload (klein) + Kombinierte Listen mit Buchungsmaske in der Mitte */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Upload Area - kleiner */}
            <div className="xl:col-span-1">
              <UploadArea />
            </div>
            
            {/* Kombinierte Interface */}
            <div className="xl:col-span-3">
              <CombinedInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;