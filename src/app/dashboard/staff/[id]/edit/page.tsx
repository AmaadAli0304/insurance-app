
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateStaff, getStaffById } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Staff } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { format } from 'date-fns';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateStaff, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        async function fetchStaff() {
            try {
                const fetchedStaff = await getStaffById(params.id);
                if (!fetchedStaff) {
                    notFound();
                    return;
                }
                setStaff(fetchedStaff);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStaff();
    }, [params.id]);


    useEffect(() => {
        if (state.type === 'success') {
           toast({
             title: "Staff Management",
             description: state.message,
             variant: "success",
           });
           router.push('/dashboard/staff');
        } else if (state.type === 'error') {
           toast({
             title: "Error",
             description: state.message,
             variant: "destructive",
           });
        }
    }, [state, router, toast]);

    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'yyyy-MM-dd');
        } catch {
            return '';
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!staff) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/staff">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Staff: {staff.fullName}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Staff Details</CardTitle>
                    <CardDescription>Modify the form to update the staff member's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={staff.id} />
                        <input type="hidden" name="companyId" value={user?.companyId || ''} />
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                                <Input id="fullName" name="fullName" defaultValue={staff.fullName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" defaultValue={staff.email ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactNumber">Contact Number</Label>
                                <Input id="contactNumber" name="contactNumber" defaultValue={staff.contactNumber ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input id="designation" name="designation" defaultValue={staff.designation ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" name="department" defaultValue={staff.department ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="joiningDate">Joining Date</Label>
                                <Input id="joiningDate" name="joiningDate" type="date" defaultValue={formatDateForInput(staff.joiningDate)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" name="endDate" type="date" defaultValue={formatDateForInput(staff.endDate)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shiftTiming">Shift Timing</Label>
                                <Input id="shiftTiming" name="shiftTiming" defaultValue={staff.shiftTiming ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={staff.status}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
