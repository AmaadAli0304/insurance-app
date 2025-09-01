
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdatePatient, getPatientEditPageData, handleUploadPatientFile, Doctor } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Upload, User as UserIcon, Loader2, Eye, File as FileIcon } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Patient, Company, TPA } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IctCodeSearch } from "@/components/ict-code-search";
import { ChiefComplaintForm, Complaint } from "@/components/chief-complaint-form";
import { PhoneInput } from "@/components/phone-input";
import { DoctorSearch } from "@/components/doctor-search";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

const FileUploadField = ({ label, name, onUploadComplete, initialData }: { label: string; name: string; onUploadComplete: (fieldName: string, name: string, url: string) => void; initialData?: { url: string | null; name: string | null } | null }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(initialData?.url || null);
    const [fileName, setFileName] = useState<string | null>(initialData?.name || null);
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
                setFileName(result.name);
                onUploadComplete(name, result.name, result.url);
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
                    <div className="flex items-center gap-2">
                        {fileName && <span className="text-sm text-muted-foreground truncate max-w-[100px]">{fileName}</span>}
                        <Button variant="outline" size="icon" asChild>
                            <Link href={fileUrl} target="_blank">
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
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
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [chiefComplaints, setChiefComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const [documentUrls, setDocumentUrls] = useState<Record<string, { url: string, name: string }>>({});
    const [totalCost, setTotalCost] = useState(0);

    const roomCategories = [
        "ICU", "General", "Deluxe", "MICU", "SICU", "Super Deluxe", "ICCU", "Male", 
        "Female Ward", "Private", "Deluxe Suite", "Peadiatric", "Burns", "BMC", "OPD", 
        "Economy1", "Dialysis", "Twin Sharing", "Ladies Ward", "NICU", "GW1", "ICU I", 
        "ICU II", "GW I", "GW II", "Semi Deluxe", "Capped Bed", "Super deluxe 2", 
        "Triple Sharing", "EXECUTIVE 01", "EXECUTIVE II", "EXECUTIVE I", "CLASSIC", 
        "CLASSIC I", "CLASSIC II", "CLASSIC III", "CLASSIC SUITE I", "CLASSIC SUITE II", 
        "CLASSIC SUITE III", "RECOVERY", "SPECIAL", "SEMI SPECIAL"
    ];

     const calculateTotalCost = React.useCallback(() => {
        const form = document.querySelector('form');
        if (!form) return;
        const costs = [
            'roomNursingDietCost', 'investigationCost', 'icuCost',
            'otCost', 'professionalFees', 'medicineCost', 'otherHospitalExpenses'
        ];
        let sum = 0;
        costs.forEach(id => {
            const input = form.querySelector(`#${id}`) as HTMLInputElement;
            if (input && input.value) {
                sum += parseFloat(input.value) || 0;
            }
        });
        setTotalCost(sum);
    }, []);

    useEffect(() => {
        if (patient) {
            calculateTotalCost();
        }
    }, [patient, calculateTotalCost]);


    useEffect(() => {
        async function loadData() {
            try {
                const editData = await getPatientEditPageData(id);

                if (!editData || !editData.patient) {
                    notFound();
                    return;
                }
                
                const { patient: patientData, companies, tpas, doctors, complaints } = editData;

                setPatient(patientData);
                setCompanies(companies);
                setTpas(tpas);
                setDoctors(doctors);
                setChiefComplaints(complaints);

                if (patientData.photo && typeof patientData.photo === 'object') {
                    setPhotoUrl(patientData.photo.url);
                    setPhotoName(patientData.photo.name);
                }
                
                const initialDocUrls: Record<string, { url: string, name: string }> = {};
                const docFields: (keyof Patient)[] = ['adhaar_path', 'pan_path', 'passport_path', 'voter_id_path', 'driving_licence_path', 'other_path'];

                for (const field of docFields) {
                    const value = patientData[field];
                    if (value && typeof value === 'object') {
                         initialDocUrls[field] = { url: value.url, name: value.name };
                    }
                }
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
    
    const handleDocumentUploadComplete = (fieldName: string, name: string, url: string) => {
        setDocumentUrls(prev => ({ ...prev, [fieldName]: { url, name } }));
    };

    const today = new Date().toISOString().split('T')[0];

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
                    <React.Fragment key={key}>
                      <input type="hidden" name={`${key}_url`} value={value.url} />
                      <input type="hidden" name={`${key}_name`} value={value.name} />
                    </React.Fragment>
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

                     <Accordion type="multiple" className="w-full space-y-6" defaultValue={["patient-details", "insurance-details"]}>
                        <Card>
                            <AccordionItem value="patient-details">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>A. Patient Details</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                                            <Input id="firstName" name="firstName" defaultValue={patient.firstName} required />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                                            <Input id="lastName" name="lastName" defaultValue={patient.lastName} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email_address">Email Address <span className="text-destructive">*</span></Label>
                                            <Input id="email_address" name="email_address" type="email" defaultValue={patient.email_address ?? ''} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone_number">Registered mobile number <span className="text-destructive">*</span></Label>
                                            <PhoneInput name="phone_number" defaultValue={patient.phoneNumber ?? ''} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="alternative_number">Alternate contact number</Label>
                                            <PhoneInput name="alternative_number" defaultValue={patient.alternative_number ?? ''} />
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
                                            <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.dateOfBirth ?? ''} max={today} />
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
                                </AccordionContent>
                            </AccordionItem>
                        </Card>

                        <Card>
                             <AccordionItem value="kyc-documents">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>B. KYC &amp; Documents</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <FileUploadField label="Aadhaar Card" name="adhaar_path" onUploadComplete={(name, url) => handleDocumentUploadComplete("adhaar_path", name, url)} initialData={patient.adhaar_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="PAN Card" name="pan_path" onUploadComplete={(name, url) => handleDocumentUploadComplete("pan_path", name, url)} initialData={patient.pan_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Passport" name="passport_path" onUploadComplete={(name, url) => handleDocumentUploadComplete("passport_path", name, url)} initialData={patient.passport_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Driving License" name="driving_licence_path" onUploadComplete={(name, url) => handleDocumentUploadComplete("driving_licence_path", name, url)} initialData={patient.driving_licence_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Voter ID" name="voter_id_path" onUploadComplete={(name, url) => handleDocumentUploadComplete("voter_id_path", name, url)} initialData={patient.voter_id_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Other Document" name="other_path" onUploadComplete={(name, url) => handleDocumentUploadComplete("other_path", name, url)} initialData={patient.other_path as {url: string, name: string} | undefined} />
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>

                        <Card>
                            <AccordionItem value="insurance-details">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>C. Insurance &amp; Admission Details</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="admission_id">Admission ID <span className="text-destructive">*</span></Label>
                                            <Input id="admission_id" name="admission_id" defaultValue={patient.admission_id ?? ''} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="relationship_policyholder">Relationship to policyholder <span className="text-destructive">*</span></Label>
                                            <Select name="relationship_policyholder" required defaultValue={patient.relationship_policyholder ?? undefined}>
                                                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Sister">Sister</SelectItem>
                                                    <SelectItem value="Brother">Brother</SelectItem>
                                                    <SelectItem value="Mother">Mother</SelectItem>
                                                    <SelectItem value="Father">Father</SelectItem>
                                                    <SelectItem value="Son">Son</SelectItem>
                                                    <SelectItem value="Daughter">Daughter</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                            <Label htmlFor="sumInsured">Sum Insured</Label>
                                            <Input id="sumInsured" name="sumInsured" type="number" defaultValue={patient.sumInsured ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sumUtilized">Sum Utilized</Label>
                                            <Input id="sumUtilized" name="sumUtilized" type="number" defaultValue={patient.sumUtilized ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="totalSum">Total Sum</Label>
                                            <Input id="totalSum" name="totalSum" type="number" defaultValue={patient.totalSum ?? ''} />
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
                                            <PhoneInput name="family_doctor_phone" defaultValue={patient.family_doctor_phone ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="payer_email">Proposer/Payer email ID <span className="text-destructive">*</span></Label>
                                            <Input id="payer_email" name="payer_email" type="email" defaultValue={patient.payer_email ?? ''} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="payer_phone">Proposer/Payer phone number <span className="text-destructive">*</span></Label>
                                            <PhoneInput name="payer_phone" defaultValue={patient.payer_phone ?? ''} required />
                                        </div>
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
                                            <DoctorSearch
                                                doctors={doctors}
                                                defaultDoctorId={patient.doctor_id ?? undefined}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="treat_doc_number">Treating doctor’s contact <span className="text-destructive">*</span></Label>
                                            <PhoneInput id="treat_doc_number" name="treat_doc_number" defaultValue={patient.treat_doc_number ?? ''} required />
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
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                        
                        <Card>
                            <AccordionItem value="clinical-info">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>D. Clinical Information <span className="text-destructive">*</span></CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="natureOfIllness">Nature of illness / presenting complaints <span className="text-destructive">*</span></Label>
                                            <Textarea id="natureOfIllness" name="natureOfIllness" defaultValue={patient.natureOfIllness ?? ''} required/>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="clinicalFindings">Relevant clinical findings <span className="text-destructive">*</span></Label>
                                            <Textarea id="clinicalFindings" name="clinicalFindings" defaultValue={patient.clinicalFindings ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ailmentDuration">Duration of present ailment (days) <span className="text-destructive">*</span></Label>
                                            <Input id="ailmentDuration" name="ailmentDuration" type="number" defaultValue={patient.ailmentDuration ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="firstConsultationDate">Date of first consultation <span className="text-destructive">*</span></Label>
                                            <Input id="firstConsultationDate" name="firstConsultationDate" type="date" defaultValue={patient.firstConsultationDate ?? ''} required/>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="pastHistory">Past history of present ailment <span className="text-destructive">*</span></Label>
                                            <Textarea id="pastHistory" name="pastHistory" defaultValue={patient.pastHistory ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="provisionalDiagnosis">Provisional diagnosis <span className="text-destructive">*</span></Label>
                                            <Input id="provisionalDiagnosis" name="provisionalDiagnosis" defaultValue={patient.provisionalDiagnosis ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icd10Codes">ICD-10 diagnosis code(s) <span className="text-destructive">*</span></Label>
                                            <IctCodeSearch name="icd10Codes" defaultValue={patient.icd10Codes ?? ''} required />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Proposed line of treatment <span className="text-destructive">*</span></Label>
                                            <div className="grid md:grid-cols-2 gap-4">
                                               <Input name="treatmentMedical" placeholder="Medical management" defaultValue={patient.treatmentMedical ?? ''} required/>
                                               <Input name="treatmentSurgical" placeholder="Surgical management" defaultValue={patient.treatmentSurgical ?? ''} required/>
                                               <Input name="treatmentIntensiveCare" placeholder="Intensive care" defaultValue={patient.treatmentIntensiveCare ?? ''} required/>
                                               <Input name="treatmentInvestigation" placeholder="Investigation only" defaultValue={patient.treatmentInvestigation ?? ''} required/>
                                               <Input name="treatmentNonAllopathic" placeholder="Non-allopathic" defaultValue={patient.treatmentNonAllopathic ?? ''} required/>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="investigationDetails">Investigation / medical management details <span className="text-destructive">*</span></Label>
                                            <Textarea id="investigationDetails" name="investigationDetails" defaultValue={patient.investigationDetails ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="drugRoute">Route of drug administration <span className="text-destructive">*</span></Label>
                                            <Input id="drugRoute" name="drugRoute" defaultValue={patient.drugRoute ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="procedureName">Planned procedure / surgery name <span className="text-destructive">*</span></Label>
                                            <Input id="procedureName" name="procedureName" defaultValue={patient.procedureName ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icd10PcsCodes">ICD-10-PCS / procedure code(s) <span className="text-destructive">*</span></Label>
                                            <Input id="icd10PcsCodes" name="icd10PcsCodes" defaultValue={patient.icd10PcsCodes ?? ''} required/>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="otherTreatments">Any other treatments (details) <span className="text-destructive">*</span></Label>
                                            <Textarea id="otherTreatments" name="otherTreatments" defaultValue={patient.otherTreatments ?? ''} required/>
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>

                         <Card>
                            <AccordionItem value="accident-info">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>E. Accident / Medico-Legal</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isInjury" name="isInjury" defaultChecked={patient.isInjury} />
                                            <Label htmlFor="isInjury">Due to injury/accident?</Label>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="injuryCause">How did injury occur?</Label>
                                            <Input id="injuryCause" name="injuryCause" defaultValue={patient.injuryCause ?? ''} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isRta" name="isRta" defaultChecked={patient.isRta} />
                                            <Label htmlFor="isRta">Road Traffic Accident?</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="injuryDate">Date of injury</Label>
                                            <Input id="injuryDate" name="injuryDate" type="date" defaultValue={patient.injuryDate ?? ''} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isReportedToPolice" name="isReportedToPolice" defaultChecked={patient.isReportedToPolice} />
                                            <Label htmlFor="isReportedToPolice">Reported to police?</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="firNumber">FIR number</Label>
                                            <Input id="firNumber" name="firNumber" defaultValue={patient.firNumber ?? ''} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isAlcoholSuspected" name="isAlcoholSuspected" defaultChecked={patient.isAlcoholSuspected} />
                                            <Label htmlFor="isAlcoholSuspected">Alcohol/substance use?</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isToxicologyConducted" name="isToxicologyConducted" defaultChecked={patient.isToxicologyConducted} />
                                            <Label htmlFor="isToxicologyConducted">Toxicology test done?</Label>
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                        
                        <Card>
                            <AccordionItem value="maternity-info">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>F. Maternity</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isMaternity" name="isMaternity" defaultChecked={patient.isMaternity} />
                                            <Label htmlFor="isMaternity">Is this a maternity case?</Label>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 md:col-span-2">
                                            <Input name="g" type="number" placeholder="G" defaultValue={patient.g ?? ''} />
                                            <Input name="p" type="number" placeholder="P" defaultValue={patient.p ?? ''} />
                                            <Input name="l" type="number" placeholder="L" defaultValue={patient.l ?? ''} />
                                            <Input name="a" type="number" placeholder="A" defaultValue={patient.a ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedDeliveryDate">Expected date of delivery</Label>
                                            <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" defaultValue={patient.expectedDeliveryDate ?? ''} />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>

                        <Card>
                            <AccordionItem value="cost-info">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>G. Admission &amp; Cost Estimate <span className="text-destructive">*</span></CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4" onBlur={calculateTotalCost}>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionDate">Admission date <span className="text-destructive">*</span></Label>
                                            <Input id="admissionDate" name="admissionDate" type="date" defaultValue={patient.admissionDate ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionTime">Admission time <span className="text-destructive">*</span></Label>
                                            <Input id="admissionTime" name="admissionTime" type="time" defaultValue={patient.admissionTime ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionType">Type of admission <span className="text-destructive">*</span></Label>
                                            <Input id="admissionType" name="admissionType" placeholder="e.g. Emergency, Planned" defaultValue={patient.admissionType ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedStay">Expected days of stay <span className="text-destructive">*</span></Label>
                                            <Input id="expectedStay" name="expectedStay" type="number" defaultValue={patient.expectedStay ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedIcuStay">Expected days in ICU <span className="text-destructive">*</span></Label>
                                            <Input id="expectedIcuStay" name="expectedIcuStay" type="number" defaultValue={patient.expectedIcuStay ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="roomCategory">Requested room category <span className="text-destructive">*</span></Label>
                                             <Select name="roomCategory" required defaultValue={patient.roomCategory ?? undefined}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a room category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roomCategories.map(category => (
                                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="roomNursingDietCost">Room + Nursing + Diet (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="roomNursingDietCost" name="roomNursingDietCost" type="number" defaultValue={patient.roomNursingDietCost ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="investigationCost">Diagnostics/investigations cost (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="investigationCost" name="investigationCost" type="number" defaultValue={patient.investigationCost ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icuCost">ICU charges (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="icuCost" name="icuCost" type="number" defaultValue={patient.icuCost ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otCost">OT charges (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="otCost" name="otCost" type="number" defaultValue={patient.otCost ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="professionalFees">Professional fees (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="professionalFees" name="professionalFees" type="number" defaultValue={patient.professionalFees ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="medicineCost">Medicines + consumables (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="medicineCost" name="medicineCost" type="number" defaultValue={patient.medicineCost ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otherHospitalExpenses">Other hospital expenses (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="otherHospitalExpenses" name="otherHospitalExpenses" type="number" defaultValue={patient.otherHospitalExpenses ?? ''} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="packageCharges">All-inclusive package charges (₹) <span className="text-destructive">*</span></Label>
                                            <Input id="packageCharges" name="packageCharges" type="number" defaultValue={patient.packageCharges ?? ''} required/>
                                        </div>
                                        <div className="space-y-2 md:col-span-3">
                                            <Label htmlFor="totalExpectedCost">Total expected cost (₹)</Label>
                                            <Input id="totalExpectedCost" name="totalExpectedCost" type="number" value={totalCost} readOnly className="font-bold text-lg" />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                        
                        <ChiefComplaintForm initialData={chiefComplaints} patientId={id} />
                        
                        <Card>
                            <AccordionItem value="declarations-info">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>I. Declarations &amp; Attachments <span className="text-destructive">*</span></CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationName">Patient/insured name <span className="text-destructive">*</span></Label>
                                                <Input id="patientDeclarationName" name="patientDeclarationName" defaultValue={patient.patientDeclarationName ?? ''} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationContact">Contact number <span className="text-destructive">*</span></Label>
                                                <PhoneInput name="patientDeclarationContact" defaultValue={patient.patientDeclarationContact ?? ''} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationEmail">Email ID <span className="text-destructive">*</span></Label>
                                                <Input id="patientDeclarationEmail" name="patientDeclarationEmail" type="email" defaultValue={patient.patientDeclarationEmail ?? ''} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationDate">Declaration date <span className="text-destructive">*</span></Label>
                                                <Input id="patientDeclarationDate" name="patientDeclarationDate" type="date" defaultValue={patient.patientDeclarationDate ?? ''} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationTime">Declaration time <span className="text-destructive">*</span></Label>
                                                <Input id="patientDeclarationTime" name="patientDeclarationTime" type="time" defaultValue={patient.patientDeclarationTime ?? ''} required />
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4 border-t pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="hospitalDeclarationDoctorName">Hospital declaration – doctor name <span className="text-destructive">*</span></Label>
                                                <Input id="hospitalDeclarationDoctorName" name="hospitalDeclarationDoctorName" defaultValue={patient.hospitalDeclarationDoctorName ?? ''} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hospitalDeclarationDate">Declaration date <span className="text-destructive">*</span></Label>
                                                <Input id="hospitalDeclarationDate" name="hospitalDeclarationDate" type="date" defaultValue={patient.hospitalDeclarationDate ?? ''} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hospitalDeclarationTime">Declaration time <span className="text-destructive">*</span></Label>
                                                <Input id="hospitalDeclarationTime" name="hospitalDeclarationTime" type="time" defaultValue={patient.hospitalDeclarationTime ?? ''} required />
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t">
                                            <Label>Attachments to enclose</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {['ID proof', 'Policy copy', 'Doctor’s notes', 'Investigations', 'Estimate'].map(item => (
                                                    <div key={item} className="flex items-center space-x-2">
                                                        <Checkbox id={`att-${item}`} name="attachments" value={item} defaultChecked={patient.attachments?.includes(item)} />
                                                        <Label htmlFor={`att-${item}`} className="font-normal">{item}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    </Accordion>


                    <div className="flex justify-end">
                        {state.type === 'error' && <p className="text-sm text-destructive self-center mr-4">{state.message}</p>}
                        <SubmitButton />
                    </div>
                </div>
            </form>
        </div>
    );
}
