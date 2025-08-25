
"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddStaff } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Staff Member"}
        </Button>
    );
}

export default function NewStaffPage() {
    const [state, formAction] = useActionState(handleAddStaff, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();

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
                variant: "destructive"
            });
        }
    }, [state, toast, router]);


    return (
        <div className="space-y-6">
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
