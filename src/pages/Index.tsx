import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { ReviewInterface } from "@/components/dashboard/ReviewInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
  );
};

export default Index;