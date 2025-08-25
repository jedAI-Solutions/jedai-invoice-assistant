import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  pending_since?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isActive: () => boolean;
  isPending: () => boolean;
  isRejected: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log('Profile fetched successfully:', data);
      return data as Profile;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST to prevent deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        // Only synchronous state updates here to prevent deadlock
        setSession(session);
        setUser(session?.user ?? null);
        
        // Keep loading true until profile is fetched
        if (session?.user) {
          setLoading(true);
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id).then(userProfile => {
                if (mounted) {
                  // Check if user is active and approved
                  if (userProfile && (!userProfile.is_active || userProfile.status !== 'approved')) {
                    console.log('User is not active or approved, signing out:', userProfile);
                    supabase.auth.signOut();
                    toast.error('Your account is not active or approved. Please contact an administrator.');
                    setProfile(null);
                    setUser(null);
                    setSession(null);
                  } else {
                    setProfile(userProfile);
                    console.log('Profile loaded after auth change:', userProfile);
                  }
                  setLoading(false);
                }
              });
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Initial session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          if (mounted) {
            // Check if user is active and approved
            if (userProfile && (!userProfile.is_active || userProfile.status !== 'approved')) {
              console.log('Initial user is not active or approved, signing out:', userProfile);
              await supabase.auth.signOut();
              toast.error('Your account is not active or approved. Please contact an administrator.');
              setProfile(null);
              setUser(null);
              setSession(null);
            } else {
              setProfile(userProfile);
              console.log('Initial profile loaded:', userProfile);
            }
          }
        } else {
          setProfile(null);
        }
        
        if (mounted) {
          console.log('Setting initial loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the confirmation link!');
      
      // Send confirmation email and admin notification for new user registration
      if (data.user) {
        try {
          // Send welcome email to user
          await supabase.functions.invoke('send-confirmation-email', {
            body: {
              userId: data.user.id,
              email: data.user.email,
              firstName,
              lastName,
              type: 'welcome'
            }
          });
          console.log('Welcome email sent to new user:', email);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the signup if email fails
        }

        try {
          // Send admin notification
          await supabase.functions.invoke('notify-admin-new-user', {
            body: {
              userId: data.user.id,
              email: data.user.email,
              firstName,
              lastName
            }
          });
          console.log('Admin notification sent for new user:', email);
        } catch (notificationError) {
          console.error('Failed to send admin notification:', notificationError);
          // Don't fail the signup if notification fails
        }
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        if (error.message.includes('403') || error.message.includes('unauthorized')) {
          toast.error('Google OAuth not configured properly. Please check the setup instructions.');
        } else {
          toast.error(`Google sign-in error: ${error.message}`);
        }
      }
      
      return { error };
    } catch (err) {
      console.error('Google sign-in error:', err);
      toast.error('Google sign-in failed. Please try again.');
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Always clear local state regardless of API response
      setUser(null);
      setSession(null);
      setProfile(null);
      
      if (error && error.message !== 'Session not found') {
        console.warn('Sign out error (but continuing):', error.message);
        toast.error(error.message);
      } else {
        toast.success('Signed out successfully');
      }
    } catch (err) {
      console.error('Sign out error:', err);
      // Still clear local state even if there's an error
      setUser(null);
      setSession(null);
      setProfile(null);
      toast.success('Signed out successfully');
    }
  };

  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const isActive = () => {
    return profile?.is_active === true;
  };

  const isPending = () => {
    return profile?.status === 'pending';
  };

  const isRejected = () => {
    return profile?.status === 'rejected';
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAdmin,
    isActive,
    isPending,
    isRejected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};