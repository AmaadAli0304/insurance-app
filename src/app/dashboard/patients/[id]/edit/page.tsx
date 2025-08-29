
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdatePatient, getPatientById, handleUploadPatientFile } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Upload, User as UserIcon, Loader2, Eye } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompaniesForForm, getTPAsForForm } from "@/app/dashboard/company-hospitals/actions";
import type { Patient, Company, TPA } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

const FileUploadField = ({ label, name, onUrlChange, initialUrl }: { label: string; name: string; onUrlChange: (url: string) => void; initialUrl?: string | null }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(initialUrl || null);
    const { toast } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', name);
            
            const result = await handleUploadPatientFile(formData);
            if (result.type === 'success' && result.url) {
                setFileUrl(result.url);
                onUrlChange(result.url);
                toast({ title: "Success", description: `${label} uploaded.`, variant: "success" });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input id={name} name={`${name}-file`} type="file" onChange={handleFileChange} disabled={isUploading} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                {fileUrl && !isUploading && (
                    <Button variant="outline" size="icon" asChild>
                        <Link href={fileUrl} target="_blank">
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
};


export default function EditPatientPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    
    const [state, formAction] = useActionState(handleUpdatePatient, { message: "", type: 'initial' });
    const [patient, setPatient] = useState<Patient | null>(null);
    const [companies, setCompanies] = useState<Pick<Company, "id" | "name">[]>([]);
    const [tpas, setTpas] = useState<Pick<TPA, "id" | "name">[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});


    useEffect(() => {
        async function loadData() {
            try {
                const [patientData, companyList, tpaList] = await Promise.all([
                    getPatientById(id),
                    getCompaniesForForm(),
                    getTPAsForForm()
                ]);

                if (!patientData) {
                    notFound();
                    return;
                }
                
                setPatient(patientData);
                setCompanies(companyList);
                setTpas(tpaList);
                if (patientData.photo) {
                    setPhotoUrl(patientData.photo);
                }
                const initialDocUrls: Record<string, string> = {};
                if(patientData.adhaar_path) initialDocUrls.adhaar_path = patientData.adhaar_path;
                if(patientData.pan_path) initialDocUrls.pan_path = patientData.pan_path;
                if(patientData.passport_path) initialDocUrls.passport_path = patientData.passport_path;
                if(patientData.voter_id_path) initialDocUrls.voter_id_path = patientData.voter_id_path;
                if(patientData.driving_licence_path) initialDocUrls.driving_licence_path = patientData.driving_licence_path;
                if(patientData.other_path) initialDocUrls.other_path = patientData.other_path;
                setDocumentUrls(initialDocUrls);

            } catch (error) {
                toast({ title: "Error", description: "Failed to load patient data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id, toast]);
    
     useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Patient", description: state.message, variant: "success" });
            router.push('/dashboard/patients');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (!patient) {
        return notFound();
    }
    
    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploadingPhoto(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', 'photo');
            const result = await handleUploadPatientFile(formData);
            if (result.type === 'success' && result.url) {
                setPhotoUrl(result.url);
                setPhotoName(result.name);
                toast({ title: "Success", description: "Photo uploaded.", variant: "success" });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
            setIsUploadingPhoto(false);
        }
    };
    
    const handleDocumentUrlChange = (name: string, url: string) => {
        setDocumentUrls(prev => ({ ...prev, [name]: url }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Patient</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="id" value={patient.id} />
                 <input type="hidden" name="hospital_id" value={user?.hospitalId || ''} />
                 <input type="hidden" name="photoUrl" value={photoUrl || ''} />
                 <input type="hidden" name="photoName" value={photoName || ''} />
                 {Object.entries(documentUrls).map(([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                 ))}
                <div className="grid gap-6">
                    <Card className="flex flex-col items-center p-6">
                        <Avatar className="h-32 w-32 mb-4">
                           {isUploadingPhoto ? (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <AvatarImage src={photoUrl ?? undefined} alt={patient.fullName} />
                                    <AvatarFallback>
                                        <UserIcon className="h-16 w-16" />
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                        <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </Button>
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

                    {/* Patient Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>A. Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Full Name (as per ID proof) <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={patient.fullName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email_address">Email Address <span className="text-destructive">*</span></Label>
                                <Input id="email_address" name="email_address" type="email" defaultValue={patient.email_address ?? ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone_number">Registered mobile number <span className="text-destructive">*</span></Label>
                                <Input id="phone_number" name="phone_number" defaultValue={patient.phoneNumber ?? ''} required maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="alternative_number">Alternate contact number</Label>
                                <Input id="alternative_number" name="alternative_number" defaultValue={patient.alternative_number ?? ''} maxLength={10} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                                <Select name="gender" defaultValue={patient.gender ?? undefined} required>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" name="age" type="number" defaultValue={patient.age ?? ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Date of birth</Label>
                                <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.dateOfBirth ?? ''} />
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                                <Input id="address" name="address" defaultValue={patient.address ?? ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="occupation">Occupation</Label>
                                <Input id="occupation" name="occupation" defaultValue={patient.occupation ?? ''} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="employee_id">Employee ID</Label>
                                <Input id="employee_id" name="employee_id" defaultValue={patient.employee_id ?? ''} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="abha_id">ABHA ID</Label>
                                <Input id="abha_id" name="abha_id" defaultValue={patient.abha_id ?? ''} />
                            </div>
                              <div className="space-y-2">
                                <Label htmlFor="health_id">Health ID / UHID</Label>
                                <Input id="health_id" name="health_id" defaultValue={patient.health_id ?? ''} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>B. KYC &amp; Documents</CardTitle>
                            <CardDescription>Upload patient's KYC documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <FileUploadField label="Aadhaar Card" name="adhaar_path" onUrlChange={(url) => handleDocumentUrlChange("adhaar_path", url)} initialUrl={patient.adhaar_path} />
                            <FileUploadField label="PAN Card" name="pan_path" onUrlChange={(url) => handleDocumentUrlChange("pan_path", url)} initialUrl={patient.pan_path} />
                            <FileUploadField label="Passport" name="passport_path" onUrlChange={(url) => handleDocumentUrlChange("passport_path", url)} initialUrl={patient.passport_path} />
                            <FileUploadField label="Driving License" name="driving_licence_path" onUrlChange={(url) => handleDocumentUrlChange("driving_licence_path", url)} initialUrl={patient.driving_licence_path} />
                            <FileUploadField label="Voter ID" name="voter_id_path" onUrlChange={(url) => handleDocumentUrlChange("voter_id_path", url)} initialUrl={patient.voter_id_path} />
                            <FileUploadField label="Other Document" name="other_path" onUrlChange={(url) => handleDocumentUrlChange("other_path", url)} initialUrl={patient.other_path} />
                        </CardContent>
                    </Card>

                    {/* Insurance Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>C. Insurance &amp; Admission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="admission_id">Admission ID <span className="text-destructive">*</span></Label>
                                <Input id="admission_id" name="admission_id" defaultValue={patient.admission_id ?? ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relationship_policyholder">Relationship to policyholder <span className="text-destructive">*</span></Label>
                                <Input id="relationship_policyholder" name="relationship_policyholder" defaultValue={patient.relationship_policyholder ?? ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policy_number">Policy number <span className="text-destructive">*</span></Label>
                                <Input id="policy_number" name="policy_number" defaultValue={patient.policyNumber ?? ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="insured_card_number">Insured member / card ID number <span className="text-destructive">*</span></Label>
                                <Input id="insured_card_number" name="insured_card_number" defaultValue={patient.memberId ?? ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_id">Insurance Company <span className="text-destructive">*</span></Label>
                                <Select name="company_id" required defaultValue={patient.companyId} disabled={isLoading}>
                                    <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="policy_start_date">Policy Start Date <span className="text-destructive">*</span></Label>
                                <Input id="policy_start_date" name="policy_start_date" type="date" defaultValue={patient.policyStartDate ?? ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policy_end_date">Policy End Date <span className="text-destructive">*</span></Label>
                                <Input id="policy_end_date" name="policy_end_date" type="date" defaultValue={patient.policyEndDate ?? ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="corporate_policy_number">Corporate policy name/number</Label>
                                <Input id="corporate_policy_number" name="corporate_policy_number" defaultValue={patient.corporate_policy_number ?? ''} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="other_policy_name">Other active health insurance</Label>
                                <Input id="other_policy_name" name="other_policy_name" defaultValue={patient.other_policy_name ?? ''} placeholder="Name of other insurer" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="family_doctor_name">Family physician name</Label>
                                <Input id="family_doctor_name" name="family_doctor_name" defaultValue={patient.family_doctor_name ?? ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="family_doctor_phone">Family physician contact</Label>
                                <Input id="family_doctor_phone" name="family_doctor_phone" defaultValue={patient.family_doctor_phone ?? ''} maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="payer_email">Proposer/Payer email ID <span className="text-destructive">*</span></Label>
                                <Input id="payer_email" name="payer_email" type="email" defaultValue={patient.payer_email ?? ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="payer_phone">Proposer/Payer phone number <span className="text-destructive">*</span></Label>
                                <Input id="payer_phone" name="payer_phone" defaultValue={patient.payer_phone ?? ''} required maxLength={10} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hospital & TPA Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>D. Hospital &amp; TPA Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tpa_id">Select TPA <span className="text-destructive">*</span></Label>
                                <Select name="tpa_id" disabled={isLoading} required defaultValue={patient.tpa_id?.toString() ?? undefined}>
                                    <SelectTrigger><SelectValue placeholder="Select a TPA" /></SelectTrigger>
                                    <SelectContent>
                                        {tpas.map(t => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="treat_doc_name">Treating doctor’s name <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_name" name="treat_doc_name" defaultValue={patient.treat_doc_name ?? ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="treat_doc_number">Treating doctor’s contact <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_number" name="treat_doc_number" defaultValue={patient.treat_doc_number ?? ''} required maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="treat_doc_qualification">Doctor’s qualification <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_qualification" name="treat_doc_qualification" defaultValue={patient.treat_doc_qualification ?? ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="treat_doc_reg_no">Doctor’s registration no. <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_reg_no" name="treat_doc_reg_no" defaultValue={patient.treat_doc_reg_no ?? ''} required />
                            </div>
                        </CardContent>
                    </Card>

                    {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
