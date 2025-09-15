
"use client";

import { useState, useEffect, useCallback, useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStaffForAttendance, getAttendanceForMonth, saveAttendance } from "./actions";
import type { Staff } from "@/lib/types";
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFormStatus } from "react-dom";

function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Attendance
                </>
            )}
        </Button>
    );
}


export default function AttendancePage() {
  const [staffList, setStaffList] = useState<Pick<Staff, 'id' | 'name'>[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<number, boolean>>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [state, formAction] = useActionState(saveAttendance, { message: "", type: "initial" });
  const { toast } = useToast();

  const loadAttendanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const [staff, attendanceData] = await Promise.all([
        getStaffForAttendance(),
        getAttendanceForMonth(month, year)
      ]);
      setStaffList(staff);
      setAttendance(attendanceData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (state.type === 'success') {
      toast({ title: "Success", description: state.message, variant: "success" });
      loadAttendanceData(); // Refetch data on successful save
    } else if (state.type === 'error') {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, loadAttendanceData]);


  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  const handleAttendanceChange = (staffId: string, day: number) => {
    setAttendance(prev => {
        const newAttendance = { ...prev };
        newAttendance[staffId] = { ...(prev[staffId] || {}) };
        
        newAttendance[staffId][day] = !newAttendance[staffId][day];
        return newAttendance;
    });
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col h-full">
        <Card className="flex-shrink-0">
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>Staff Attendance</CardTitle>
                        <CardDescription>Mark attendance for each staff member for the selected month.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-medium w-32 text-center">{monthName} {year}</span>
                            <Button type="button" variant="outline" size="icon" onClick={() => changeMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
        <div className="flex-grow overflow-y-auto">
            <Card className="mt-6">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : error ? (
                        <div className="p-6">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <form action={formAction} className="space-y-4">
                            <input type="hidden" name="month" value={month + 1} />
                            <input type="hidden" name="year" value={year} />
                            <input type="hidden" name="attendanceData" value={JSON.stringify(attendance)} />
                            <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky left-0 bg-background z-10 w-[200px] min-w-[200px]">Staff Name</TableHead>
                                            {days.map(day => <TableHead key={day} className="text-center min-w-[50px]">{day}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staffList.map(staff => (
                                            <TableRow key={staff.id}>
                                                <TableCell className="sticky left-0 bg-background z-10 font-medium">{staff.name}</TableCell>
                                                {days.map(day => {
                                                    const dayDate = new Date(year, month, day);
                                                    const isFutureDate = dayDate > today;
                                                    return (
                                                        <TableCell key={day} className="text-center">
                                                            <Checkbox
                                                                checked={!!attendance[staff.id]?.[day]}
                                                                onCheckedChange={() => handleAttendanceChange(staff.id, day)}
                                                                disabled={isFutureDate}
                                                            />
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end sticky bottom-0 bg-background/95 p-4 border-t">
                                <SaveButton />
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
