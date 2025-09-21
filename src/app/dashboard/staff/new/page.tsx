
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddStaff, getHospitalsForForm, getPresignedUrl } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, User as UserIcon, Loader2, XCircle } from "lucide-react";
import type { Hospital, UserRole } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-provider";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
            {pending ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
            ) : (
                "Add Staff Member"
            )}
        </Button>
    );
}

async function uploadFile(file: File): Promise<{ publicUrl: string } | { error: string }> {
    const key = `uploads/staff/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    
    const presignedUrlResult = await getPresignedUrl(key, file.type);
    if ("error" in presignedUrlResult) {
        return { error: presignedUrlResult.error };
    }

    const { url, publicUrl } = presignedUrlResult;

    const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type,
        },
    });

    if (!res.ok) {
        return { error: "Failed to upload file to S3." };
    }
    
    return { publicUrl };
}

const roles: UserRole[] = ['Admin', 'Hospital Staff', 'Company Admin'];

export default function NewStaffPage() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddStaff, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

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

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploadingPhoto(true);
            const result = await uploadFile(file);

            if (photoInputRef.current) { 
                if ("publicUrl" in result) {
                    setPhotoUrl(result.publicUrl);
                    setPhotoName(file.name);
                    toast({ title: "Success", description: "Photo uploaded.", variant: "success" });
                } else {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                }
                setIsUploadingPhoto(false);
            }
        }
    };

    const handleCancelPhotoUpload = () => {
        setIsUploadingPhoto(false);
        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        }
        setPhotoUrl(null);
        setPhotoName(null);
        toast({ title: "Cancelled", description: "Photo upload has been cancelled.", variant: "default" });
    };

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
            
             <form action={formAction}>
                <input type="hidden" name="photoUrl" value={photoUrl || ''} />
                <input type="hidden" name="photoName" value={photoName || ''} />
                <input type="hidden" name="userId" value={user?.uid ?? ''} />
                <input type="hidden" name="userName" value={user?.name ?? ''} />
                 <div className="space-y-6">
                    <Card className="flex flex-col items-center p-6">
                        <Avatar className="h-32 w-32 mb-4">
                           {isUploadingPhoto ? (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <AvatarImage src={photoUrl ?? undefined} alt="Staff Photo" />
                                    <AvatarFallback>
                                        <UserIcon className="h-16 w-16" />
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                         <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto}>
                                <Upload className="mr-2 h-4 w-4" />
                                {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                            </Button>
                            {isUploadingPhoto && (
                                <Button type="button" variant="ghost" size="icon" onClick={handleCancelPhotoUpload}>
                                    <XCircle className="h-6 w-6 text-destructive" />
                                </Button>
                            )}
                        </div>
                        <Input 
                            ref={photoInputRef}
                            id="photo-upload" 
                            name="photo-upload-file" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoChange} 
                        />
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal & Contact Info</CardTitle>
                             <CardDescription>Enter the basic details for the new staff member.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
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
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Professional Details</CardTitle>
                             <CardDescription>Assign roles and departments.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                                <Select name="role" required defaultValue="Hospital Staff">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hospitalId">Assign Hospital</Label>
                                <Select name="hospitalId" defaultValue="none">
                                    <SelectTrigger disabled={isLoading}>
                                        <SelectValue placeholder="Select a hospital" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
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
                                <Label htmlFor="shiftTime">Shift Timing</Label>
                                <Input id="shiftTime" name="shiftTime" placeholder="e.g., 9 AM - 6 PM" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Employment Details</CardTitle>
                             <CardDescription>Manage employment status and dates.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="joiningDate">Joining Date</Label>
                                <Input id="joiningDate" name="joiningDate" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" name="endDate" type="date" />
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
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        {state.type === 'error' && <p className="text-sm text-destructive self-center">{state.message}</p>}
                        <Button variant="outline" asChild><Link href="/dashboard/staff">Cancel</Link></Button>
                        <SubmitButton />
                    </div>
                </div>
            </form>
        </div>
    );
}
