"use client";

import { useSession } from "next-auth/react";
import { PermissionNode, hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const usePermission = (module: PermissionNode) => {
  const { data: session, status } = useSession();
  
  if (status === "loading") return { isLoading: true, isAllowed: false };
  if (!session?.user) return { isLoading: false, isAllowed: false };
  
  const role = (session.user as any).role as Role;
  return { 
     isLoading: false, 
     isAllowed: hasPermission(role, module) 
  };
};

interface PermissionGuardProps {
  required: PermissionNode;
  children: React.ReactNode;
}

export const PermissionGuard = ({ required, children }: PermissionGuardProps) => {
  const { isLoading, isAllowed } = usePermission(required);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Checking Access Constraints...</div>;
  }

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center p-8 h-full min-h-[400px]">
         <Card className="shadow-lg border-rose-200">
            <CardHeader className="bg-rose-50 text-rose-800 rounded-t-lg">
               <div className="flex items-center gap-3">
                  <ShieldAlert className="h-8 w-8 text-rose-600" />
                  <div>
                     <CardTitle className="text-xl">403 Access Denied</CardTitle>
                     <CardDescription className="text-rose-600/80 mt-1">Unauthorized Logics Locked Structure</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="pt-6 text-center text-muted-foreground max-w-sm">
               You are attempting to parse bounds tracking `{required}` natively. Your current organizational Role constraints mathematically explicitly forbid this operation smoothly securely!
            </CardContent>
         </Card>
      </div>
    );
  }

  return <>{children}</>;
};
