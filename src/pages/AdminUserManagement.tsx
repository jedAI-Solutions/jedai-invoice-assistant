import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  AlertCircle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Debug logging
  console.log('AdminUserManagement - Profile:', profile);
  console.log('AdminUserManagement - IsAdmin:', isAdmin());
  console.log('AdminUserManagement - AuthLoading:', authLoading);

  // Redirect if not admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6"><div className="max-w-7xl mx-auto"><div className="text-center">Laden...</div></div></div>
    );
  }
  if (!isAdmin()) {
    console.log('Redirecting because not admin - Profile role:', profile?.role);
    return <Navigate to="/" replace />;
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
    if (isAdmin()) {
      fetchUsers();
    }
  }, [profile?.role]);

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Benutzerverwaltung</h1>
            <p className="text-muted-foreground">Benutzer genehmigen und verwalten</p>
          </div>
          <Users className="h-8 w-8 text-primary" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Genehmigt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Abgelehnt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedUsers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users Section */}
        {pendingUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                Ausstehende Genehmigungen ({pendingUsers.length})
              </CardTitle>
              <CardDescription>
                Diese Benutzer warten auf Ihre Genehmigung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Registriert</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'Kein Name'
                            }
                          </p>
                          {getRoleBadge(user.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
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
                            className="bg-green-600 hover:bg-green-700"
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
                              >
                                <X className="h-4 w-4 mr-1" />
                                Ablehnen
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Benutzer ablehnen</DialogTitle>
                                <DialogDescription>
                                  Möchten Sie {user.email} ablehnen? Optional können Sie einen Grund angeben.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="reason">Grund der Ablehnung (optional)</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Grund für die Ablehnung..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
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
                                >
                                  Abbrechen
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => selectedUser && rejectUser(selectedUser.id, rejectionReason)}
                                  disabled={actionLoading}
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

        {/* All Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Benutzer</CardTitle>
            <CardDescription>
              Übersicht aller registrierten Benutzer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead>Genehmigt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'Kein Name'
                        }
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status, user.is_active)}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell>
                      {user.approved_at 
                        ? new Date(user.approved_at).toLocaleDateString('de-DE')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserManagement;