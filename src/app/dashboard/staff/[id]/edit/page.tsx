
"use client";

import { useActionState, useEffect, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateStaff, getStaffById } from "../../actions";
import { notFound, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Staff } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateStaff, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [preview, setPreview] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);


    useEffect(() => {
        async function fetchStaff() {
            try {
                const fetchedStaff = await getStaffById(params.id);
                if (!fetchedStaff) {
                    notFound();
                    return;
                }
                setStaff(fetchedStaff);
                if (fetchedStaff.photo) {
                    setPreview(fetchedStaff.photo);
                    setPhotoUrl(fetchedStaff.photo);
                }
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

    const formatDateForInput = (dateString?: string | null) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'yyyy-MM-dd');
        } catch {
            return '';
        }
    };
    
    const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                setPhotoUrl(data.url);
                toast({ title: "Success", description: "Photo uploaded." });
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error) {
            const uploadError = error as Error;
            toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
            setPreview(staff?.photo || null);
        } finally {
            setIsUploading(false);
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
            <Card>
                <CardHeader>
                    <CardTitle>Update Staff Details</CardTitle>
                    <CardDescription>Modify the form to update the staff member's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={staff.id} />
                        <input type="hidden" name="photo" value={photoUrl || ''} />
                        
                        <div className="flex items-center gap-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={preview ?? undefined} alt="Staff photo" />
                                <AvatarFallback>
                                    {isUploading ? (
                                        <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <UserIcon className="h-10 w-10" />
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <Label htmlFor="photo-upload">Staff Photo</Label>
                                <Input id="photo-upload" name="photo-file" type="file" accept="image/*" onChange={handlePhotoChange} disabled={isUploading} />
                                <p className="text-xs text-muted-foreground">Upload a new photo to replace the existing one.</p>
                            </div>
                        </div>

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
