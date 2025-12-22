

"use client"

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Clock, AlertTriangle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { getCompanyAdminDashboardStats, getHospitalBusinessStats, getSimpleHospitalBusinessStats, getStaffPerformanceStats, HospitalBusinessStats, SimpleHospitalStat, StaffPerformanceStat } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BusinessSummaryTable } from "./business-summary-table";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { PatientBillingTable } from "./patient-billing-table";
import { SimpleBusinessSummaryTable } from "./simple-business-summary-table";
import { StaffPerformanceTable } from "./staff-performance-table";
import { StaffOnDutyTable } from "./staff-on-duty-table";
import { FinalApprovalDetailsTable } from "./final-approval-details-table";
import { SettledStatusDetailsTable } from "./settled-status-details-table";
import { NewReportTable } from "@/components/dashboard/admin/new-report-table";
import { SummaryReportTable } from "./summary-report-table";


interface DashboardStats {
  totalHospitals: number;
  livePatients: number;
  pendingRequests: number;
  rejectedRequests: number;
}

export function CompanyAdminDashboard() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [businessStats, setBusinessStats] = useState<HospitalBusinessStats[]>([]);
  const [staffPerformanceStats, setStaffPerformanceStats] = useState<StaffPerformanceStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const fetchDashboardStats = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      setError("User is not associated with a company.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [dashboardData, businessData] = await Promise.all([
          getCompanyAdminDashboardStats(companyId, date),
          getHospitalBusinessStats(date),
      ]);
      setStats(dashboardData);
      setBusinessStats(businessData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, date]);

  const fetchStaffPerformance = useCallback(async () => {
    try {
      setIsLoadingStaff(true);
      const staffData = await getStaffPerformanceStats(date);
      setStaffPerformanceStats(staffData);
    } catch (err: any) {
       // Assuming main error state will catch major issues
      console.error("Failed to load staff performance:", err);
    } finally {
      setIsLoadingStaff(false);
    }
  }, [date]);


  useEffect(() => {
    fetchDashboardStats();
    fetchStaffPerformance();
  }, [fetchDashboardStats, fetchStaffPerformance]);
  
  if (error && !isLoading) {
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
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Dashboard for {user?.name}</h1>
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
       ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalHospitals ?? 0}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Live Patients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.livePatients ?? 0}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingRequests ?? 0}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-500">{stats?.rejectedRequests ?? 0}</div>
                </CardContent>
            </Card>
          </div>

          <BusinessSummaryTable stats={businessStats}>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
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
          </BusinessSummaryTable>
          
          <SummaryReportTable />
          
          <NewReportTable />

          <SimpleBusinessSummaryTable />

          <PatientBillingTable dateRange={date} />
          
          <StaffPerformanceTable stats={staffPerformanceStats} isLoading={isLoadingStaff} />
          
          <StaffOnDutyTable />

          <FinalApprovalDetailsTable dateRange={date} />

          <SettledStatusDetailsTable dateRange={date} />
          
        </>
      )}
    </div>
  )
}
