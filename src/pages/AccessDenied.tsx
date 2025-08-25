import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Mail, LogOut } from 'lucide-react';
import aiHeaderBg from "@/assets/ai-header-bg.jpg";
import jedaiLogoIcon from "@/assets/jedai-logo-icon.png";

const AccessDenied = () => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${aiHeaderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={jedaiLogoIcon}
              alt="jedAI Solutions Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white font-modern leading-tight
                       [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.8)] filter drop-shadow-lg mb-2">
             TaxAgent
           </h1>
           <p className="text-white font-modern font-semibold
                        [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.9)]">
             KI-gestützte Belegverarbeitung
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
            <CardTitle className="text-center text-white font-semibold">
              Zugang verweigert
            </CardTitle>
            <CardDescription className="text-center text-white/80">
              Ihr Registrierungsantrag wurde abgelehnt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <Mail className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-white text-sm">
                  <strong>Registrierung abgelehnt</strong>
                </p>
                <p className="text-white/80 text-xs mt-1">
                  {profile?.email}
                </p>
              </div>
              
              <div className="text-white/90 text-sm leading-relaxed">
                <p className="mb-3">
                  Leider wurde Ihr Registrierungsantrag für TaxAgent abgelehnt.
                </p>
                {profile?.rejection_reason && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 mb-3">
                    <p className="text-white font-medium text-xs mb-1">Grund der Ablehnung:</p>
                    <p className="text-white/90 text-xs">
                      {profile.rejection_reason}
                    </p>
                  </div>
                )}
                <p className="mb-3">
                  Bitte wenden Sie sich an Ihren Administrator, falls Sie Fragen haben oder eine erneute Prüfung wünschen.
                </p>
                {profile?.approved_at && (
                  <p className="text-xs text-white/70">
                    Entschieden am: {new Date(profile.approved_at).toLocaleString('de-DE')}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <Button 
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessDenied;