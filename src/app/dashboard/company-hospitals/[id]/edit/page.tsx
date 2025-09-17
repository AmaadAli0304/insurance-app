
"use client";
import * as React from "react";
import { useState, useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateHospital, getStaff, getCompaniesForForm, getTPAsForForm, getHospitalById } from "../../actions";
import Link from "next/link";
import { ArrowLeft, ChevronsUpDown, X, Building, Loader2, Upload } from "lucide-react";
import { notFound, useRouter, useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Staff, Company, TPA, Hospital } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/phone-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPresignedUrl } from "@/app/dashboard/staff/actions";

async function uploadFile(file: File): Promise<{ publicUrl: string } | { error: string }> {
    const key = `uploads/hospitals/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const presignedUrlResult = await getPresignedUrl(key, file.type);
    if ("error" in presignedUrlResult) {
        return { error: presignedUrlResult.error };
    }
    const { url, publicUrl } = presignedUrlResult;
    const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!res.ok) return { error: "Failed to upload file to S3." };
    return { publicUrl };
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditCompanyHospitalPage() {
    const params = useParams();
    const id = params.id as string;
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [state, formAction] = useActionState(handleUpdateHospital, { message: "", type: 'initial' });
    const router = useRouter();
    const { toast } = useToast();
    
    const [companies, setCompanies] = useState<Pick<Company, 'id' | 'name'>[]>([]);
    const [tpas, setTpas] = useState<Pick<TPA, 'id' | 'name'>[]>([]);
    const [staff, setStaff] = useState<Pick<Staff, 'id' | 'name'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedTPAs, setSelectedTPAs] = useState<string[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
    
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const [hospitalData, staffList, companiesList, tpasList] = await Promise.all([
                    getHospitalById(id),
                    getStaff(),
                    getCompaniesForForm(),
                    getTPAsForForm()
                ]);

                if (!hospitalData) {
                    notFound();
                    return;
                }

                setHospital(hospitalData);
                setStaff(staffList);
                setCompanies(companiesList);
                setTpas(tpasList);

                setSelectedCompanies(hospitalData.assignedCompanies || []);
                setSelectedTPAs(hospitalData.assignedTPAs || []);
                setSelectedStaff(hospitalData.assignedStaff || []);
                setPhotoUrl(hospitalData.photo || null);
            } catch (error) {
                console.error("Failed to fetch data for hospital form", error);
                toast({ title: "Error", description: "Failed to load required data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id, toast]);


    useEffect(() => {
        if (state.type === 'success') {
           toast({
             title: "Hospital Management",
             description: "Hospital updated successfully",
             variant: "success",
           });
           router.push('/dashboard/company-hospitals');
        } else if (state.type === 'error') {
           toast({
             title: "Error",
             description: state.message,
             variant: "destructive",
           });
        }
    }, [state, router, toast]);
    
    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploadingPhoto(true);
            const result = await uploadFile(file);
            if ("publicUrl" in result) {
                setPhotoUrl(result.publicUrl);
                toast({ title: "Success", description: "Photo uploaded.", variant: "success" });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
            setIsUploadingPhoto(false);
        }
    };
    

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!hospital) {
        notFound();
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/company-hospitals">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Hospital</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Hospital Details</CardTitle>
                    <CardDescription>Modify the form to update the hospital's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={hospital.id} />
                        <input type="hidden" name="photoUrl" value={photoUrl || ''} />

                        <div className="flex flex-col items-center p-6">
                          <Avatar className="h-32 w-32 mb-4">
                           {isUploadingPhoto ? (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <AvatarImage src={photoUrl ?? undefined} alt={hospital.name} />
                                    <AvatarFallback><Building className="h-16 w-16" /></AvatarFallback>
                                </>
                            )}
                          </Avatar>
                          <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto}>
                            <Upload className="mr-2 h-4 w-4" /> {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                          </Button>
                          <Input ref={photoInputRef} id="photo-upload" name="photo-upload-file" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </div>

                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Hospital Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={hospital.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" defaultValue={hospital.location ?? ""} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address</Label>
                            <Textarea id="address" name="address" defaultValue={hospital.address ?? ""} />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" defaultValue={hospital.contactPerson ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={hospital.email ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <PhoneInput name="phone" defaultValue={hospital.phone ?? ""} />
                            </div>
                        </div>

                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Assigned Insurance Companies</Label>
                                <input type="hidden" name="assignedInsuranceCompanies" value={selectedCompanies.join(',')} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <div className="flex-1 text-left font-normal">
                                                {selectedCompanies.length > 0
                                                    ? `${selectedCompanies.length} selected`
                                                    : "Select companies"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                                        {companies.map(company => (
                                            <DropdownMenuCheckboxItem
                                                key={company.id}
                                                checked={selectedCompanies.includes(company.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedCompanies(prev =>
                                                        checked ? [...prev, company.id] : prev.filter(id => id !== company.id)
                                                    );
                                                }}
                                            >
                                                {company.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedCompanies.map(id => (
                                        <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                            {companies.find(c=>c.id === id)?.name}
                                            <button type="button" onClick={() => setSelectedCompanies(prev => prev.filter(companyId => companyId !== id))} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Assigned TPAs</Label>
                                <input type="hidden" name="assignedTPAs" value={selectedTPAs.join(',')} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                             <div className="flex-1 text-left font-normal">
                                                {selectedTPAs.length > 0
                                                    ? `${selectedTPAs.length} selected`
                                                    : "Select TPAs"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                                        {tpas.map(tpa => (
                                            <DropdownMenuCheckboxItem
                                                key={tpa.id}
                                                checked={selectedTPAs.includes(String(tpa.id))}
                                                onCheckedChange={(checked) => {
                                                    const tpaId = String(tpa.id);
                                                    setSelectedTPAs(prev =>
                                                        checked ? [...prev, tpaId] : prev.filter(id => id !== tpaId)
                                                    );
                                                }}
                                            >
                                                {tpa.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedTPAs.map(id => (
                                        <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                            {tpas.find(t=>String(t.id) === id)?.name}
                                            <button type="button" onClick={() => setSelectedTPAs(prev => prev.filter(tpaId => tpaId !== id))} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label>Assigned Staff</Label>
                            <input type="hidden" name="assignedStaff" value={selectedStaff.join(',')} />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <div className="flex-1 text-left font-normal">
                                            {selectedStaff.length > 0
                                                ? `${selectedStaff.length} staff selected`
                                                : "Select staff"}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                                    {staff.map(s => (
                                        <DropdownMenuCheckboxItem
                                            key={s.id}
                                            checked={selectedStaff.includes(s.id)}
                                            onCheckedChange={(checked) => {
                                                const staffId = s.id;
                                                setSelectedStaff(prev =>
                                                    checked ? [...prev, staffId] : prev.filter(id => id !== staffId)
                                                );
                                            }}
                                        >
                                            {s.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {selectedStaff.map(id => (
                                     <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                        {staff.find(s => s.id === id)?.name}
                                        <button type="button" onClick={() => setSelectedStaff(prev => prev.filter(staffId => staffId !== id))} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
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
