import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AgendaInterface } from "@/components/dashboard/AgendaInterface";
import dashboardBg from "@/assets/dashboard-bg.jpg";

const AgendaImport = () => {
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
        
        <div className="max-w-7xl mx-auto p-6">
          <AgendaInterface />
        </div>
      </div>
    </div>
  );
};

export default AgendaImport;