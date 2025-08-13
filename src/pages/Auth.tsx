import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { TransparentLogo } from '@/components/TransparentLogo';
import aiHeaderBg from "@/assets/ai-header-bg.jpg";
import jedaiLogoIcon from "@/assets/jedai-logo-icon.png";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate(from, { replace: true });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(email, password);
    
    if (!error) {
      setActiveTab('signin');
    }
    
    setLoading(false);
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
      {/* Animated background layer */}
      <div 
        className="absolute inset-0 animate-bg-pan"
        style={{
          backgroundImage: `url(${aiHeaderBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      {/* Glass overlay without blur */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative group cursor-pointer">
              <img
                src={jedaiLogoIcon}
                alt="jedAI Solutions Logo"
                className="relative h-16 w-auto object-contain transition-all duration-700 ease-in-out
                         hover:scale-105 hover:brightness-110
                         animate-pulse-subtle group-hover:animate-none
                         filter hover:drop-shadow-sm"
              />
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-30 
                            transition-opacity duration-500 ease-in-out
                            bg-gradient-radial from-blue-200/30 via-transparent to-transparent
                            blur-xl scale-150"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white font-modern leading-tight
                       [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.8)] filter drop-shadow-lg
                       transition-all duration-500 ease-in-out hover:scale-[1.02] cursor-default mb-2">
            jedAI Taxagent
          </h1>
          <p className="text-white font-modern font-semibold
                       [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.9)]
                       transition-all duration-300 ease-in-out hover:text-gray-100">
            GoBD-konforme KI-Belegverarbeitung für Steuerberater
          </p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-glass">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              {activeTab === 'signin' ? 'Anmelden' : 'Konto erstellen'}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {activeTab === 'signin' 
                ? 'Bitte geben Sie Ihre Zugangsdaten ein'
                : 'Neues Benutzerkonto für jedAI Taxagent erstellen'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">E-Mail-Adresse</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ihre.email@steuerberatung.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-card/95 backdrop-blur-md border border-border shadow-lg focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Ihr Passwort eingeben"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                         className="bg-card/95 backdrop-blur-md border border-border shadow-lg pr-10 focus-visible:ring-ring"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Anmeldung...
                      </>
                    ) : (
                      'Anmelden'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-Mail-Adresse</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ihre.email@steuerberatung.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-card/95 backdrop-blur-md border border-border shadow-lg focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sicheres Passwort erstellen"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-card/95 backdrop-blur-md border border-border shadow-lg pr-10 focus-visible:ring-ring"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Passwort muss mindestens 6 Zeichen lang sein
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Konto wird erstellt...
                      </>
                    ) : (
                      'Konto erstellen'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;