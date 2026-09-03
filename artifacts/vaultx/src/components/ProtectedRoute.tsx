import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-48">
          <Skeleton className="h-10 w-10 rounded-xl mx-auto" />
          <Skeleton className="h-3 w-3/4 mx-auto rounded-lg" />
          <Skeleton className="h-2.5 w-1/2 mx-auto rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !user?.isAdmin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
