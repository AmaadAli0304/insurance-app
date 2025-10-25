

"use client"

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminPatientBillingTable } from "./active-patients-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TpaCollectionTable } from "./tpa-collection-table";
import { RejectedCasesTable } from "./rejected-cases-table";
import { FinalApprovalDetailsTable } from "./final-approval-details-table";
import { SettledStatusDetailsTable } from "./settled-status-details-table";
import { PreAuthSummaryTable } from "./pre-auth-summary-table";
import { NewReportTable } from "./new-report-table";


export function AdminDashboard() {
  const { user } = useAuth();
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  if (!user) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
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
      <AdminPatientBillingTable dateRange={date} />
      <NewReportTable dateRange={date} />
      <PreAuthSummaryTable dateRange={date} />
      <TpaCollectionTable dateRange={date} />
      <RejectedCasesTable dateRange={date} />
      <FinalApprovalDetailsTable dateRange={date} />
      <SettledStatusDetailsTable dateRange={date} />
    </div>
  )
}
