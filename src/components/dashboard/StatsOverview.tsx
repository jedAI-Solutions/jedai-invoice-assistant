import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DashboardStats } from "@/types/booking";

interface StatsOverviewProps {
  stats: DashboardStats;
}

export const StatsOverview = ({ stats }: StatsOverviewProps) => {
  const displayStats = [
    {
      title: "Belege gesamt",
      value: stats.totalEntries.toString(),
      change: "+12%",
      trend: "up",
      description: "vs. Vortag",
      tooltip: "Gesamtanzahl aller verarbeiteten Belege für den ausgewählten Mandanten. Diese Zahl zeigt das Volumen der digitalen Belegverarbeitung und bildet die Basis für alle weiteren Kennzahlen."
    },
    {
      title: "Automatisierungsgrad", 
      value: `${Math.round(stats.avgConfidence)}%`,
      change: "+3%",
      trend: "up",
      description: `KI-Konfidenz ⌀ ${stats.avgConfidence}%`,
      tooltip: "Durchschnittliche Genauigkeit der automatischen Belegklassifizierung. Ein Wert über 80% zeigt eine hohe Automatisierungsrate - diese Belege können meist ohne manuelle Prüfung verarbeitet werden."
    },
    {
      title: "Genehmigte Rechnungen",
      value: stats.approvedBookings.toString(),
      change: "0",
      trend: "neutral",
      description: "Bereit für Export",
      tooltip: "Anzahl der freigegebenen Belege, die vollständig geprüft sind und für den Export an das Buchhaltungssystem bereitstehen. Diese können direkt übertragen werden."
    },
    {
      title: "Ausstehende Prüfungen",
      value: stats.pendingReviews.toString(),
      change: "0", 
      trend: "neutral",
      description: "Manuelle Reviews",
      tooltip: "Belege, die noch eine manuelle Kontrolle durch einen Mitarbeiter benötigen. Dies können komplexe Rechnungen oder solche mit niedriger KI-Konfidenz sein."
    },
    {
      title: "Ersparte Zeit",
      value: `${Math.round(stats.savedTime)} Min`,
      change: "+8,2%",
      trend: "up",
      description: "Vs. manuelle Prüfung",
      tooltip: "Geschätzte Zeitersparnis durch die automatische Belegverarbeitung. Basiert auf dem Unterschied zwischen manueller und automatisierter Bearbeitung pro Beleg (ca. 3 Minuten pro Dokument)."
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-success';
      case 'neutral': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'neutral': return '→';
      default: return '→';
    }
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        {displayStats.map((stat, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-help">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg md:text-xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-sm font-medium ${getTrendColor(stat.trend)}`}>
                          {getTrendIcon(stat.trend)} {stat.change}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                    {index === 1 && (
                      <div className="text-right">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          Hoch
                        </Badge>
                      </div>
                    )}
                    {index === 3 && stat.value !== "0" && (
                      <div className="text-right">
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          Prüfung
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3 bg-white/98 backdrop-blur-md border-white/50 shadow-xl">
              <p className="text-sm text-gray-900 leading-relaxed font-medium">
                {stat.tooltip}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};