import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const StatsOverview = () => {
  const stats = [
    {
      title: "Belege heute",
      value: "24",
      change: "+12%",
      trend: "up",
      description: "vs. Vortag"
    },
    {
      title: "Automatisierungsgrad",
      value: "89%",
      change: "+3%",
      trend: "up",
      description: "KI-Konfidenz ⌀ 92%"
    },
    {
      title: "Verarbeitungszeit",
      value: "1,2 Min",
      change: "-15%",
      trend: "down",
      description: "⌀ pro Beleg"
    },
    {
      title: "Ausstehende Prüfungen",
      value: "7",
      change: "0",
      trend: "neutral",
      description: "Manuelle Reviews"
    },
    {
      title: "Eingesparte Zeit",
      value: "42,5 Std",
      change: "+8,2 Std",
      trend: "up",
      description: "Kumuliert/Monat"
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gradient-card shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
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
      ))}
    </div>
  );
};