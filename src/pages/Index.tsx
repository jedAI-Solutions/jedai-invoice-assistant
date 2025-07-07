import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { ReviewInterface } from "@/components/dashboard/ReviewInterface";
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
          
          {/* Upload und Review Interface */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1">
              <UploadArea />
            </div>
            <div className="xl:col-span-2">
              <ReviewInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;