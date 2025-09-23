
"use client";

import { useState, useEffect, use } from "react";
import { getStaffById } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import type { Staff } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const DetailItem = ({ label, value }: { label: string, value?: string | number | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

export default function ViewStaffPage() {
    const params = useParams();
    const id = params.id as string;
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const staffData = await getStaffById(id);
                if (!staffData) {
                    notFound();
                    return;
                }
                setStaff(staffData);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy');
        } catch {
            return "Invalid Date";
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-destructive">Error: {error}</div>;
    }

    if (!staff) {
        return <div>Staff not found.</div>;
    }

    let photoUrl: string | null = null;
    if (staff.photo) {
        try {
            const photoData = JSON.parse(staff.photo as string);
            photoUrl = photoData.url;
        } catch {
            // It might be a direct URL string
            if (typeof staff.photo === 'string' && staff.photo.startsWith('http')) {
                photoUrl = staff.photo;
            }
        }
    }

    const getInitials = (name: string) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={photoUrl ?? undefined} alt={staff.name} />
                        <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex-1 text-center">
                            <CardTitle className="text-3xl">{staff.name}</CardTitle>
                            <CardDescription>{staff.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                    <div className="md:col-span-2 lg:col-span-3">
                         <div className="flex items-center gap-2">
                            <Badge variant="outline">{staff.role}</Badge>
                            {staff.status && <Badge variant={staff.status === 'Active' ? 'default' : 'destructive'} className={staff.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>{staff.status}</Badge>}
                        </div>
                    </div>
                    <DetailItem label="Contact Number" value={staff.number} />
                    <DetailItem label="Designation" value={staff.designation} />
                    <DetailItem label="Department" value={staff.department} />
                    <DetailItem label="Assigned Hospital" value={staff.hospitalName || "N/A"} />
                    <DetailItem label="Shift Timing" value={staff.shiftTime} />
                    <DetailItem label="Salary" value={staff.salary ? `₹${staff.salary.toLocaleString()}` : 'N/A'} />
                    <DetailItem label="Joining Date" value={formatDate(staff.joiningDate)} />
                    <DetailItem label="End Date" value={formatDate(staff.endDate)} />
                </CardContent>
            </Card>
        </div>
    );
}
