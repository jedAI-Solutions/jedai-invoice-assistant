import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { TransparentLogo } from '@/components/TransparentLogo';
import aiHeaderBg from "@/assets/ai-header-bg.jpg";
import jedaiLogoIcon from "@/assets/jedai-logo-icon.png";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      console.error('Google sign-in error:', error);
    }
    // Note: If successful, the user will be redirected, so no need to handle success here
    
    setGoogleLoading(false);
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
                className="relative h-20 w-auto object-contain transition-all duration-700 ease-in-out
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
             TaxAgent
           </h1>
           <p className="text-white font-modern font-semibold
                        [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.9)]
                        transition-all duration-300 ease-in-out hover:text-gray-100">
             KI-gestützte Belegverarbeitung
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl animate-fade-in">
          <CardHeader>
            <CardTitle className="text-center text-white font-semibold">
              {activeTab === 'signin' ? 'Anmelden' : 'Konto erstellen'}
            </CardTitle>
            <CardDescription className="text-center text-white/80">
              {activeTab === 'signin' 
                ? 'Bitte geben Sie Ihre Zugangsdaten ein'
                : 'Neues Benutzerkonto für TaxAgent erstellen'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 backdrop-blur border border-white/20">
                <TabsTrigger value="signin">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white font-medium">E-Mail-Adresse</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ihre.email@steuerberatung.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white font-medium">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Ihr Passwort eingeben"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                         className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg pr-10 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:border-white/40"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-white/70" />
                        ) : (
                          <Eye className="h-4 w-4 text-white/70" />
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
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-white/70">oder</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white hover:bg-white/20 hover:text-white" 
                    disabled={googleLoading}
                    onClick={handleGoogleSignIn}
                  >
                    {googleLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Google-Anmeldung...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Mit Google anmelden
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white font-medium">E-Mail-Adresse</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ihre.email@steuerberatung.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white font-medium">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sicheres Passwort erstellen"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg pr-10 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:border-white/40"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-white/70" />
                        ) : (
                          <Eye className="h-4 w-4 text-white/70" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-white/70">
                      Passwort muss mindestens 6 Zeichen lang sein
                    </p>
                  </div>
                  
                  {/* Admin Approval Notice */}
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                    <p className="text-white text-xs leading-relaxed">
                      <strong>Hinweis:</strong> Nach der Registrierung muss Ihr Zugang von einem Administrator freigegeben werden. Sie erhalten eine Benachrichtigung, sobald Ihr Konto aktiviert wurde.
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
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-white/70">oder</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white hover:bg-white/20 hover:text-white" 
                    disabled={googleLoading}
                    onClick={handleGoogleSignIn}
                  >
                    {googleLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Google-Registrierung...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Mit Google registrieren
                      </>
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