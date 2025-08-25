import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  Shield, 
  Mail,
  Calendar,
  AlertCircle,
  UserPlus,
  Settings,
  ArrowLeft,
  Trash2,
  UserCog
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import dashboardBg from "@/assets/dashboard-bg.jpg";
import aiHeaderBg from "@/assets/ai-header-bg.jpg";
import jedaiLogoIcon from "@/assets/jedai-logo-icon.png";

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  pending_since?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
}

const AdminUserManagement = () => {
  const { isAdmin, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [verifiedAdmin, setVerifiedAdmin] = useState<boolean | null>(isAdmin() ? true : null);
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);

  // Debug logging
  console.log('AdminUserManagement - Profile:', profile);
  console.log('AdminUserManagement - IsAdmin:', isAdmin());
  console.log('AdminUserManagement - AuthLoading:', authLoading);

  // Admin verification/loading guard
  if (authLoading || verifiedAdmin === null) {
    return (
      <div className="min-h-screen bg-background p-6"><div className="max-w-7xl mx-auto"><div className="text-center">Laden...</div></div></div>
    );
  }
  if (verifiedAdmin === false) {
    console.log('Access denied - Profile role:', profile?.role);
    return <Navigate to="/access-denied" replace />;
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Fehler beim Laden der Benutzer');
        return;
      }

      setUsers((data || []).map(user => ({
        ...user,
        status: user.status as 'pending' | 'approved' | 'rejected'
      })));
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const verify = async () => {
      try {
        if (isAdmin()) {
          console.log('AdminUserManagement - isAdmin() from profile says: true');
          setVerifiedAdmin(true);
          return;
        }
        console.log('AdminUserManagement - Verifying admin via RPC is_admin...');
        const { data, error } = await supabase.rpc('is_admin');
        console.log('AdminUserManagement - RPC is_admin result:', { data, error });
        if (error) {
          console.error('Error checking admin via RPC:', error);
          setVerifiedAdmin(false);
          return;
        }
        setVerifiedAdmin(Boolean(data));
      } catch (e) {
        console.error('Unexpected error during admin verify:', e);
        setVerifiedAdmin(false);
      }
    };
    verify();
  }, [authLoading, profile?.role]);

  // Safety net: avoid indefinite loading if verification stalls
  useEffect(() => {
    if (verifiedAdmin !== null) return;
    const t = setTimeout(() => {
      console.warn('AdminUserManagement - Verification timeout, denying access');
      setVerifiedAdmin(false);
    }, 8000);
    return () => clearTimeout(t);
  }, [verifiedAdmin]);

  useEffect(() => {
    if (verifiedAdmin) {
      fetchUsers();
    }
  }, [verifiedAdmin]);

  const approveUser = async (userId: string) => {
    if (!profile?.id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('approve_user', {
        p_user_id: userId,
        p_approved_by: profile.id
      });

      if (error) {
        console.error('Error approving user:', error);
        toast.error('Fehler beim Genehmigen des Benutzers');
        return;
      }

      toast.success('Benutzer erfolgreich genehmigt');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error in approveUser:', err);
      toast.error('Fehler beim Genehmigen des Benutzers');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectUser = async (userId: string, reason?: string) => {
    if (!profile?.id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('reject_user', {
        p_user_id: userId,
        p_rejected_by: profile.id,
        p_reason: reason || null
      });

      if (error) {
        console.error('Error rejecting user:', error);
        toast.error('Fehler beim Ablehnen des Benutzers');
        return;
      }

      toast.success('Benutzer abgelehnt');
      setSelectedUser(null);
      setRejectionReason('');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error in rejectUser:', err);
      toast.error('Fehler beim Ablehnen des Benutzers');
    } finally {
      setActionLoading(false);
    }
  };

  const changeUserRole = async (userId: string, role: string) => {
    if (!profile?.id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('change_user_role', {
        p_user_id: userId,
        p_new_role: role,
        p_changed_by: profile.id
      });

      if (error) {
        console.error('Error changing user role:', error);
        toast.error('Fehler beim Ändern der Benutzerrolle');
        return;
      }

      toast.success(`Benutzerrolle erfolgreich zu ${role} geändert`);
      setRoleChangeUser(null);
      setNewRole('');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error in changeUserRole:', err);
      toast.error('Fehler beim Ändern der Benutzerrolle');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUserAccount = async (userId: string) => {
    if (!profile?.id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('delete_user_account', {
        p_user_id: userId,
        p_deleted_by: profile.id
      });

      if (error) {
        console.error('Error deleting user account:', error);
        toast.error('Fehler beim Löschen des Benutzerkontos: ' + error.message);
        return;
      }

      toast.success('Benutzerkonto erfolgreich gelöscht');
      setDeleteUser(null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error in deleteUserAccount:', err);
      toast.error('Fehler beim Löschen des Benutzerkontos');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'pending') {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
    }
    if (status === 'approved' && isActive) {
      return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Aktiv</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
    }
    return <Badge variant="outline">Unbekannt</Badge>;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="default"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    return <Badge variant="outline">Benutzer</Badge>;
  };

  const pendingUsers = users.filter(user => user.status === 'pending');
  const approvedUsers = users.filter(user => user.status === 'approved');
  const rejectedUsers = users.filter(user => user.status === 'rejected');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay matching main page design */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-black/20" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Admin Header matching main page design */}
        <div 
          className="relative bg-glass backdrop-blur-glass shadow-glass border-b border-glass p-4 md:p-8 min-h-[120px] md:min-h-[160px] overflow-hidden"
          style={{
            backgroundImage: `url(${aiHeaderBg})`,
            backgroundSize: '120%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Animated background layer */}
          <div 
            className="absolute inset-0 animate-bg-pan"
            style={{
              backgroundImage: `url(${aiHeaderBg})`,
              backgroundSize: '130%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          
          <div className="relative z-10 max-w-full mx-auto h-full flex flex-col">
            {/* Main content area with padding for bottom elements */}
            <div className="flex-1 flex items-center justify-center gap-3 md:gap-6 pb-8">
              {/* Logo Container */}
              <div className="flex-shrink-0 relative group cursor-pointer">
                <img
                  src={jedaiLogoIcon}
                  alt="jedAI Solutions Logo"
                  className="relative h-12 md:h-24 w-auto object-contain transition-all duration-700 ease-in-out
                           hover:scale-105 hover:brightness-110
                           animate-pulse-subtle group-hover:animate-none
                           filter hover:drop-shadow-sm"
                />
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-30 
                              transition-opacity duration-500 ease-in-out
                              bg-gradient-radial from-blue-200/30 via-transparent to-transparent
                              blur-xl scale-150" />
              </div>
              
              {/* Text Container */}
              <div className="text-center">
                <h1 className="text-lg md:text-3xl font-bold text-white font-modern leading-tight
                             [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.8)] filter drop-shadow-lg
                             transition-all duration-500 ease-in-out hover:scale-[1.02] cursor-default">
                  Admin Dashboard
                </h1>
                <p className="text-xs md:text-sm text-white font-modern font-semibold mt-1
                             [text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.9)]
                             transition-all duration-300 ease-in-out hover:text-gray-100">
                  Benutzerverwaltung & Systemkonfiguration
                </p>
              </div>
            </div>

            {/* Action Section - Centered Bottom */}
            <div className="flex flex-row items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-primary text-white border-0 text-[10px] md:text-xs shadow-lg px-2 py-0.5 animate-pulse">
                  <Settings className="h-3 w-3 mr-1" />
                  Admin Modus
                </Badge>
                
                <Badge className="bg-glass backdrop-blur-md text-white border-glass text-[10px] md:text-xs shadow-lg px-2 py-0.5">
                  <UserPlus className="h-3 w-3 mr-1" />
                  {pendingUsers.length} Ausstehend
                </Badge>
              </div>
              
              {/* Back to Dashboard Button */}
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-glass bg-glass/50 backdrop-blur-md border-glass shadow-lg hover-scale transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Zurück zum Dashboard</span>
                <span className="md:hidden">Zurück</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
          {/* Statistics Cards with glass effect */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
            <Card className="bg-glass backdrop-blur-glass border-glass shadow-glass hover-scale transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Gesamt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{users.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-glass backdrop-blur-glass border-glass shadow-glass hover-scale transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Ausstehend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{pendingUsers.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-glass backdrop-blur-glass border-glass shadow-glass hover-scale transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Genehmigt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{approvedUsers.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-glass backdrop-blur-glass border-glass shadow-glass hover-scale transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Abgelehnt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{rejectedUsers.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Users Section with glass effect */}
          {pendingUsers.length > 0 && (
            <Card className="bg-glass backdrop-blur-glass border-glass shadow-glass animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-400 animate-pulse" />
                  Ausstehende Genehmigungen ({pendingUsers.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Diese Benutzer warten auf Ihre Genehmigung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-foreground">Benutzer</TableHead>
                      <TableHead className="text-foreground">E-Mail</TableHead>
                      <TableHead className="text-foreground">Registriert</TableHead>
                      <TableHead className="text-foreground">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : 'Kein Name'
                              }
                            </p>
                            {getRoleBadge(user.role)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground/60" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground/60" />
                            {new Date(user.pending_since || user.created_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                              disabled={actionLoading}
                              className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg hover-scale transition-all duration-200"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Genehmigen
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedUser(user)}
                                  disabled={actionLoading}
                                  className="hover-scale transition-all duration-200 shadow-lg"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Ablehnen
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-glass backdrop-blur-glass border-glass shadow-glass">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Benutzer ablehnen</DialogTitle>
                                  <DialogDescription className="text-white/80">
                                    Möchten Sie {user.email} ablehnen? Optional können Sie einen Grund angeben.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason" className="text-white">Grund der Ablehnung (optional)</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="Grund für die Ablehnung..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(null);
                                      setRejectionReason('');
                                    }}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                  >
                                    Abbrechen
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => selectedUser && rejectUser(selectedUser.id, rejectionReason)}
                                    disabled={actionLoading}
                                    className="shadow-lg"
                                  >
                                    Ablehnen
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* All Users Table with glass effect */}
          <Card className="bg-glass backdrop-blur-glass border-glass shadow-glass animate-fade-in">
            <CardHeader>
              <CardTitle className="text-foreground">Alle Benutzer</CardTitle>
              <CardDescription className="text-muted-foreground">
                Übersicht aller registrierten Benutzer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-foreground">Benutzer</TableHead>
                    <TableHead className="text-foreground">E-Mail</TableHead>
                    <TableHead className="text-foreground">Rolle</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Registriert</TableHead>
                    <TableHead className="text-foreground">Genehmigt</TableHead>
                    <TableHead className="text-foreground">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <p className="font-medium text-foreground">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : 'Kein Name'
                          }
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground/60" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status, user.is_active)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.approved_at 
                          ? new Date(user.approved_at).toLocaleDateString('de-DE')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {/* Role Change Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRoleChangeUser(user);
                                  setNewRole(user.role);
                                }}
                                disabled={actionLoading || user.id === profile?.id}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover-scale transition-all duration-200"
                              >
                                <UserCog className="h-4 w-4 mr-1" />
                                Rolle
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                          
                          {/* Delete User Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteUser(user)}
                                disabled={actionLoading || user.id === profile?.id}
                                className="hover-scale transition-all duration-200 shadow-lg"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Löschen
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Role Change Dialog */}
      {roleChangeUser && (
        <Dialog open={!!roleChangeUser} onOpenChange={() => setRoleChangeUser(null)}>
          <DialogContent className="bg-glass backdrop-blur-glass border-glass shadow-glass">
            <DialogHeader>
              <DialogTitle className="text-white">Benutzerrolle ändern</DialogTitle>
              <DialogDescription className="text-white/80">
                Rolle für {roleChangeUser.email} ändern
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role" className="text-white">Neue Rolle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Rolle auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-glass backdrop-blur-glass border-glass">
                    <SelectItem value="admin" className="text-white hover:bg-white/10">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Administrator
                      </div>
                    </SelectItem>
                    <SelectItem value="user" className="text-white hover:bg-white/10">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Benutzer
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer" className="text-white hover:bg-white/10">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Betrachter
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRoleChangeUser(null);
                  setNewRole('');
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => roleChangeUser && changeUserRole(roleChangeUser.id, newRole)}
                disabled={actionLoading || !newRole || newRole === roleChangeUser.role}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                Rolle ändern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Dialog */}
      {deleteUser && (
        <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <DialogContent className="bg-glass backdrop-blur-glass border-glass shadow-glass">
            <DialogHeader>
              <DialogTitle className="text-white">Benutzer löschen</DialogTitle>
              <DialogDescription className="text-white/80">
                Sind Sie sicher, dass Sie {deleteUser.email} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">Warnung: Unwiderrufliche Aktion</p>
              </div>
              <p className="text-red-300 text-sm mt-2">
                Alle Daten des Benutzers werden permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteUser(null)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteUser && deleteUserAccount(deleteUser.id)}
                disabled={actionLoading}
                className="shadow-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Endgültig löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUserManagement;