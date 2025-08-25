
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateStaff, getStaffById, getHospitalsForForm } from "../../actions";
import { notFound, useRouter, useParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Staff, Hospital } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditStaffPage() {
    const params = useParams();
    const id = params.id as string;
    const [staff, setStaff] = useState<Staff | null>(null);
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateStaff, { message: "", type: "initial" });
    const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        async function fetchData() {
            try {
                const [fetchedStaff, hospitalList] = await Promise.all([
                    getStaffById(id),
                    getHospitalsForForm()
                ]);
                
                if (!fetchedStaff) {
                    notFound();
                    return;
                }
                setStaff(fetchedStaff);
                setHospitals(hospitalList);
                setSelectedHospitalId(fetchedStaff.hospitalId || "");
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);


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

    const formatDateForInput = (dateString?: string | null) => {
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
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/staff">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Staff Member</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Staff Details</CardTitle>
                    <CardDescription>Modify the form to update the staff member's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={staff.id} />
                        
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={staff.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" defaultValue={staff.email ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="number">Contact Number</Label>
                                <Input id="number" name="number" defaultValue={staff.number ?? ""} maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" placeholder="Leave blank to keep current password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hospitalId">Assign Hospital</Label>
                                <input type="hidden" name="hospitalId" value={selectedHospitalId} />
                                <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
                                    <SelectTrigger disabled={isLoading}>
                                        <SelectValue placeholder="Select a hospital" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {hospitals.map(hospital => (
                                            <SelectItem key={hospital.id} value={hospital.id}>
                                                {hospital.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <Label htmlFor="shiftTime">Shift Timing</Label>
                                <Input id="shiftTime" name="shiftTime" defaultValue={staff.shiftTime ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={staff.status ?? undefined}>
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
