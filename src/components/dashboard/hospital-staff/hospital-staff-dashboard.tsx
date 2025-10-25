
"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Clock, AlertTriangle, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { StatCard } from "@/components/dashboard/stat-card"
import { getDashboardData, DashboardData } from "./actions";
import { PendingPreAuthsTable } from "./pending-preauths-table";
import { RejectedPreAuthsTable } from "./rejected-preauths-table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { NewReportTable } from "@/components/dashboard/admin/new-report-table";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export function HospitalStaffDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  
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
         <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full md:w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
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

      <NewReportTable dateRange={date} />
      <PendingPreAuthsTable requests={data?.pendingPreAuths ?? []} title="Pending Pre-Auths" description="These pre-authorization requests are awaiting action from the TPA/Insurer." filename="pending_pre_auths.csv" />
      <PendingPreAuthsTable requests={data?.queryRaisedPreAuths ?? []} title="Query Raised Pre-Auths" description="These requests have queries raised by the TPA/Insurer and require your action." filename="query_raised_pre_auths.csv" />
      <RejectedPreAuthsTable requests={data?.rejectedPreAuths ?? []} />

    </div>
  )
}
