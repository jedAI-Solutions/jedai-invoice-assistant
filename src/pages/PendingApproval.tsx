import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, LogOut } from 'lucide-react';
import { TransparentLogo } from '@/components/TransparentLogo';
import aiHeaderBg from "@/assets/ai-header-bg.jpg";
import jedaiLogoIcon from "@/assets/jedai-logo-icon.png";

const PendingApproval = () => {
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
              <Clock className="h-12 w-12 text-yellow-400" />
            </div>
            <CardTitle className="text-center text-white font-semibold">
              Freigabe ausstehend
            </CardTitle>
            <CardDescription className="text-center text-white/80">
              Ihr Zugang wird geprüft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm">
                  <strong>Registrierung eingegangen</strong>
                </p>
                <p className="text-white/80 text-xs mt-1">
                  {profile?.email}
                </p>
              </div>
              
              <div className="text-white/90 text-sm leading-relaxed">
                <p className="mb-3">
                  Vielen Dank für Ihre Registrierung bei TaxAgent. Ihr Benutzerkonto wurde erfolgreich erstellt und wartet nun auf die Freigabe durch einen Administrator.
                </p>
                <p className="mb-3">
                  Sie erhalten eine E-Mail-Benachrichtigung, sobald Ihr Zugang freigeschaltet wurde.
                </p>
                {profile?.pending_since && (
                  <p className="text-xs text-white/70">
                    Registriert am: {new Date(profile.pending_since).toLocaleString('de-DE')}
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

export default PendingApproval;