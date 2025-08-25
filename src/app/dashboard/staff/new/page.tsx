
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddStaff, getHospitalsForForm } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Hospital } from "@/lib/types";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
            ) : (
                "Add Staff Member"
            )}
        </Button>
    );
}

export default function NewStaffPage() {
    const [state, formAction] = useActionState(handleAddStaff, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        async function loadHospitals() {
            try {
                setIsLoading(true);
                const hospitalList = await getHospitalsForForm();
                setHospitals(hospitalList);
            } catch (error) {
                console.error("Failed to fetch hospitals", error);
                toast({ title: "Error", description: "Failed to load hospitals.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadHospitals();
    }, [toast]);


    useEffect(() => {
        if (state.type === 'success') {
            toast({
                title: "Staff",
                description: state.message,
                variant: "success",
            });
            router.push('/dashboard/staff');
        } else if (state.type === 'error') {
            toast({
                title: "Error",
                description: state.message,
                variant: "destructive"
            });
        }
    }, [state, toast, router]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/staff">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Staff Member</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Staff Details</CardTitle>
                    <CardDescription>Fill in the form to add a new staff member.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" placeholder="e.g., John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" placeholder="e.g., john.d@company.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="number">Contact Number</Label>
                                <Input id="number" name="number" placeholder="e.g., 9876543210" maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hospitalId">Assign Hospital</Label>
                                <Select name="hospitalId" defaultValue="">
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
                                <Input id="designation" name="designation" placeholder="e.g., Claim Coordinator" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" name="department" placeholder="e.g., Claims Processing" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="joiningDate">Joining Date</Label>
                                <Input id="joiningDate" name="joiningDate" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" name="endDate" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shiftTime">Shift Timing</Label>
                                <Input id="shiftTime" name="shiftTime" placeholder="e.g., 9 AM - 6 PM" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue="Active">
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
