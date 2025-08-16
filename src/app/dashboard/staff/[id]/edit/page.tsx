
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdateStaff } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockHospitals, mockStaff } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
    const staff = mockStaff.find(s => s.id === params.id);
    const [state, formAction] = useFormState(handleUpdateStaff, { message: "" });

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
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" defaultValue={staff.fullName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" defaultValue={staff.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactNumber">Contact Number</Label>
                                <Input id="contactNumber" name="contactNumber" defaultValue={staff.contactNumber} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input id="designation" name="designation" defaultValue={staff.designation} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input id="department" name="department" defaultValue={staff.department} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hospitalId">Assigned Hospital</Label>
                                <Select name="hospitalId" defaultValue={staff.hospitalId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select hospital" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockHospitals.map(h => (
                                            <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="joiningDate">Joining Date</Label>
                                <Input id="joiningDate" name="joiningDate" type="date" defaultValue={staff.joiningDate} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                <Input id="endDate" name="endDate" type="date" defaultValue={staff.endDate} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shiftTiming">Shift Timing (Optional)</Label>
                                <Input id="shiftTiming" name="shiftTiming" defaultValue={staff.shiftTiming} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" required defaultValue={staff.status}>
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
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
