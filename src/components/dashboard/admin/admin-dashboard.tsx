
"use client"

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { getPatientBilledStatsForAdmin, PatientBilledStat } from "./actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminPatientBillingTable } from "./active-patients-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export function AdminDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [patientBillingStats, setPatientBillingStats] = useState<PatientBilledStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const fetchAllStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const patientData = await getPatientBilledStatsForAdmin(date, hospitalId);
      setPatientBillingStats(patientData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [date, hospitalId]);

  useEffect(() => {
    if (user) { // Wait for user to be available
      fetchAllStats();
    }
  }, [fetchAllStats, user]);


  const sqlQuery = `
    SELECT
        p.id AS patientId,
        p.first_name + ' ' + p.last_name AS patientName,
        p.photo AS patientPhoto,
        COALESCE(t.name, co.name, 'N/A') as tpaName,
        ISNULL(SUM(CASE WHEN c.status IN ('Pre auth Sent', 'Enhancement Request') THEN c.amount ELSE 0 END), 0) as billedAmount,
        ISNULL(SUM(CASE WHEN c.status IN ('Amount Sanctioned', 'Final Amount Sanctioned', 'Amount Received', 'Settlement Done', 'Paid') THEN c.paidAmount ELSE 0 END), 0) as sanctionedAmount
    FROM claims c
    JOIN patients p ON c.Patient_id = p.id
    LEFT JOIN preauth_request pr ON c.admission_id = pr.admission_id
    LEFT JOIN companies co ON pr.company_id = co.id
    LEFT JOIN tpas t ON c.tpa_id = t.id
    WHERE 
        (c.hospital_id = @hospitalId OR @hospitalId IS NULL)
    AND (@dateFrom IS NULL OR c.created_at BETWEEN @dateFrom AND @dateTo)
    GROUP BY
        p.id,
        p.first_name,
        p.last_name,
        p.photo,
        co.name,
        t.name
    ORDER BY
        billedAmount DESC;
  `;


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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
      </div>

       {isLoading ? (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
       ) : (
        <>
            <AdminPatientBillingTable stats={patientBillingStats} />

            <Card>
                <CardHeader>
                    <CardTitle>SQL Query for Active Patients Table</CardTitle>
                    <CardDescription>This is the query used to fetch the data above. The `@hospitalId` parameter is set if the admin is assigned to a hospital.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                        <code>{sqlQuery.trim()}</code>
                    </pre>
                </CardContent>
            </Card>
        </>
       )}
      
    </div>
  )
}
