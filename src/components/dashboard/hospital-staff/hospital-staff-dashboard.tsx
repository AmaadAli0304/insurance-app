
"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { StatCard } from "@/components/dashboard/stat-card"
import { getDashboardData, DashboardData } from "./actions";
import { PendingPreAuthsTable } from "./pending-preauths-table";
import { RejectedPreAuthsTable } from "./rejected-preauths-table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function HospitalStaffDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadDashboardData = useCallback(async () => {
    if (!hospitalId) {
        setIsLoading(false);
        setError("You are not assigned to a hospital. Please contact an administrator.");
        return;
    }
    setIsLoading(true);
    try {
        const dashboardData = await getDashboardData(hospitalId);
        setData(dashboardData);
    } catch(err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    if (user) {
        loadDashboardData();
    }
  }, [user, loadDashboardData]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
     return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Live Patients"
          value={data?.stats?.livePatients ?? 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Requests"
          value={data?.stats?.pendingRequests ?? 0}
          icon={Clock}
          color="bg-teal-500"
        />
        <StatCard
          title="Total Requests"
          value={data?.stats?.totalRequests ?? 0}
          icon={FileText}
          color="bg-slate-800"
          isCurrency={false}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Pre-Auths</CardTitle>
          <CardDescription>These pre-authorization requests are awaiting action from the TPA/Insurer.</CardDescription>
        </CardHeader>
        <CardContent>
          <PendingPreAuthsTable requests={data?.pendingPreAuths ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Query Raised Pre-Auths</CardTitle>
          <CardDescription>These requests have queries raised by the TPA/Insurer and require your action.</CardDescription>
        </CardHeader>
        <CardContent>
          <PendingPreAuthsTable requests={data?.queryRaisedPreAuths ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rejected Pre-Auths</CardTitle>
          <CardDescription>These requests have been rejected by the TPA/Insurer.</CardDescription>
        </CardHeader>
        <CardContent>
          <RejectedPreAuthsTable requests={data?.rejectedPreAuths ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
