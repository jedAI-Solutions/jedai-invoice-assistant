import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, isActive, isPending, isRejected } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Require a loaded profile; block access if missing or inactive
  if (!profile) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!isActive()) {
    if (isPending()) {
      return <Navigate to="/pending-approval" replace />;
    }
    if (isRejected()) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};