

"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdatePatient, getPatientEditPageData, getPresignedUrl, Doctor } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Upload, User as UserIcon, Loader2, Eye, File as FileIcon, XCircle } from "lucide-react";
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
import { intervalToDuration } from "date-fns";
import { countries } from "@/lib/countries";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

async function uploadFile(file: File): Promise<{ publicUrl: string } | { error: string }> {
    const key = `uploads/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    
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


const FileUploadField = React.memo(({ label, name, onUploadComplete, initialData }: { label: string; name: string; onUploadComplete: (fieldName: string, name: string, url: string) => void; initialData?: { url: string | null; name: string | null } | null }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(initialData?.url || null);
    const [fileName, setFileName] = useState<string | null>(initialData?.name || null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            
            const result = await uploadFile(file);

            if (fileInputRef.current) {
                if ("publicUrl" in result) {
                    setFileUrl(result.publicUrl);
                    setFileName(file.name);
                    onUploadComplete(name, file.name, result.publicUrl);
                    toast({ title: "Success", description: `${label} uploaded.`, variant: "success" });
                } else {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                }
                setIsUploading(false);
            }
        }
    };
    
    const handleCancelUpload = () => {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
        toast({ title: "Cancelled", description: "File upload has been cancelled.", variant: "default" });
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input ref={fileInputRef} id={name} name={`${name}-file`} type="file" onChange={handleFileChange} disabled={isUploading} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {isUploading && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <Button variant="ghost" size="icon" onClick={handleCancelUpload}>
                            <XCircle className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                )}
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
});
FileUploadField.displayName = 'FileUploadField';


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
    
    const formRef = useRef<HTMLFormElement>(null);
    const [doctorContact, setDoctorContact] = useState('');
    const [age, setAge] = useState<string>('');
    const [totalSum, setTotalSum] = useState<number | string>('');

    const parsePhoneNumber = (fullNumber: string | null | undefined) => {
        if (!fullNumber) return { code: "+91", number: "" };
        const sortedCountries = [...countries].sort((a, b) => getNumericCode(b.code).length - getNumericCode(a.code).length);
        const foundCountry = sortedCountries.find(c => fullNumber.startsWith(getNumericCode(c.code)));
        
        if (foundCountry) {
            const numericCode = getNumericCode(foundCountry.code);
            return {
                code: foundCountry.code,
                number: fullNumber.substring(numericCode.length)
            };
        }
        return { code: "+91", number: fullNumber.replace(/^\+91/, '') };
    };

    const getNumericCode = (code: string) => code.split('-')[0];

    const handleDoctorSelect = (doctor: Doctor | null) => {
        const form = formRef.current;
        if (doctor && form) {
            const parsedPhone = parsePhoneNumber(doctor.phone);
            setDoctorContact(doctor.phone || ''); // Set the full number for the PhoneInput's value
            (form.elements.namedItem('treat_doc_qualification') as HTMLInputElement).value = doctor.qualification || '';
            (form.elements.namedItem('treat_doc_reg_no') as HTMLInputElement).value = doctor.reg_no || '';
        } else if (form) {
            setDoctorContact('');
            (form.elements.namedItem('treat_doc_qualification') as HTMLInputElement).value = '';
            (form.elements.namedItem('treat_doc_reg_no') as HTMLInputElement).value = '';
        }
    };


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
        const form = formRef.current;
        if (!form) return;
        const costs = [
            'roomNursingDietCost', 'investigationCost', 'icuCost',
            'otCost', 'professionalFees', 'medicineCost', 'otherHospitalExpenses', 'packageCharges'
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

    const handleAgeAndTotalSumCalculation = React.useCallback(() => {
        const form = formRef.current;
        if (!form) return;

        // Age
        const dobInput = form.elements.namedItem('birth_date') as HTMLInputElement;
        if (dobInput) {
            setAge(calculateAge(dobInput.value));
        }

        // Total Sum
        const insuredInput = form.elements.namedItem('sumInsured') as HTMLInputElement;
        const utilizedInput = form.elements.namedItem('sumUtilized') as HTMLInputElement;
        
        if (insuredInput && utilizedInput) {
            const insured = parseFloat(insuredInput.value);
            const utilized = parseFloat(utilizedInput.value);

            if (!isNaN(insured) && !isNaN(utilized)) {
                setTotalSum(insured - utilized);
            } else if (!isNaN(insured)) {
                setTotalSum(insured);
            } else {
                setTotalSum('');
            }
        }
    }, []);


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
                if (patientData.dateOfBirth) {
                    setAge(calculateAge(patientData.dateOfBirth));
                }

                setTotalSum(patientData.totalSum ?? '');
                setDoctorContact(patientData.treat_doc_number ?? '');

                if (patientData.photo && typeof patientData.photo === 'object') {
                    setPhotoUrl(patientData.photo.url);
                    setPhotoName(patientData.photo.name);
                }
                
                const initialDocUrls: Record<string, { url: string, name: string }> = {};
                const docFields: (keyof Patient)[] = [
                    'adhaar_path', 'pan_path', 'passport_path', 'voter_id_path', 'driving_licence_path', 'other_path', 'policy_path',
                    'discharge_summary_path', 'final_bill_path', 'pharmacy_bill_path', 'implant_bill_stickers_path', 'lab_bill_path', 'ot_anesthesia_notes_path'
                ];

                for (const field of docFields) {
                    const value = patientData[field];
                    if (value && typeof value === 'object') {
                         initialDocUrls[field] = { url: value.url, name: value.name };
                    }
                }
                setDocumentUrls(initialDocUrls);
                
                const costFields: (keyof Patient)[] = [
                    'roomNursingDietCost', 'investigationCost', 'icuCost',
                    'otCost', 'professionalFees', 'medicineCost', 'otherHospitalExpenses', 'packageCharges'
                ];
                const initialTotalCost = costFields.reduce((acc, field) => {
                    const value = patientData[field];
                    return acc + (typeof value === 'number' ? value : 0);
                }, 0);
                setTotalCost(initialTotalCost);

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

    const calculateAge = (birthDateString: string): string => {
        if (!birthDateString) return '';
        const birthDate = new Date(birthDateString);
        const today = new Date();

        if (birthDate > today) return '';

        const duration = intervalToDuration({ start: birthDate, end: today });
        const years = duration.years || 0;
        const months = duration.months || 0;
        const days = duration.days || 0;

        if (years > 0) {
            let result = `${years} year${years > 1 ? 's' : ''}`;
            if (months > 0) {
                result += `, ${months} month${months > 1 ? 's' : ''}`;
            }
            return result;
        }
        if (months > 0) {
            let result = `${months} month${months > 1 ? 's' : ''}`;
            if (days > 0) {
                result += `, ${days} day${days !== 1 ? 's' : ''}`;
            }
            return result;
        }
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

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
            const result = await uploadFile(file);

            if (photoInputRef.current) { // Check if not cancelled
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
        toast({ title: "Cancelled", description: "Photo upload has been cancelled.", variant: "default" });
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
            <form action={formAction} ref={formRef}>
                 <input type="hidden" name="id" value={patient.id} />
                 <input type="hidden" name="admission_db_id" value={patient.admission_db_id ?? ''} />
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
                         <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto}>
                                <Upload className="mr-2 h-4 w-4" />
                                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
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

                     <Accordion type="multiple" className="w-full space-y-6" defaultValue={["patient-details", "kyc-documents", "insurance-details", "clinical-info", "accident-info", "maternity-info", "cost-info", "chief-complaints", "declarations-info"]}>
                        <Card>
                            <AccordionItem value="patient-details">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>A. Patient Details</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4" onBlurCapture={handleAgeAndTotalSumCalculation}>
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
                                            <Label htmlFor="birth_date">Date of birth</Label>
                                            <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.dateOfBirth ?? ''} max={today} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="age">Age</Label>
                                            <Input id="age" name="age" type="text" value={age} placeholder="Age" readOnly />
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
                                            <Label htmlFor="health_id">Health ID / UHID <span className="text-destructive">*</span></Label>
                                            <Input id="health_id" name="health_id" defaultValue={patient.health_id ?? ''} required />
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
                                        <FileUploadField label="Aadhaar Card" name="adhaar_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.adhaar_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="PAN Card" name="pan_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.pan_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Passport" name="passport_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.passport_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Driving License" name="driving_licence_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.driving_licence_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Voter ID" name="voter_id_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.voter_id_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Policy File" name="policy_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.policy_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Other Document" name="other_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.other_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Discharge Summary" name="discharge_summary_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.discharge_summary_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Final Bill" name="final_bill_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.final_bill_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Pharmacy Bill" name="pharmacy_bill_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.pharmacy_bill_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Implant Bill & Stickers" name="implant_bill_stickers_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.implant_bill_stickers_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="Lab Bill" name="lab_bill_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.lab_bill_path as {url: string, name: string} | undefined} />
                                        <FileUploadField label="OT &amp; Anesthesia Notes" name="ot_anesthesia_notes_path" onUploadComplete={handleDocumentUploadComplete} initialData={patient.ot_anesthesia_notes_path as {url: string, name: string} | undefined} />
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
                                    <CardContent className="grid md:grid-cols-3 gap-4" onBlurCapture={handleAgeAndTotalSumCalculation}>
                                        <div className="space-y-2">
                                            <Label htmlFor="admission_id">Admission ID <span className="text-destructive">*</span></Label>
                                            <Input id="admission_id" name="admission_id" defaultValue={patient.admission_id ?? ''} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="relationship_policyholder">Relationship to policyholder <span className="text-destructive">*</span></Label>
                                            <Select name="relationship_policyholder" required defaultValue={patient.relationship_policyholder ?? undefined}>
                                                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Self">Self</SelectItem>
                                                    <SelectItem value="Spouse">Spouse</SelectItem>
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
                                            <Input id="policy_start_date" name="policy_start_date" type="date" defaultValue={patient.policyStartDate ?? ''} required max={today} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="policy_end_date">Policy End Date <span className="text-destructive">*</span></Label>
                                            <Input id="policy_end_date" name="policy_end_date" type="date" defaultValue={patient.policyEndDate ?? ''} required min={today} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sumInsured">Sum Insured</Label>
                                            <Input id="sumInsured" name="sumInsured" type="number" min="0" defaultValue={patient.sumInsured ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sumUtilized">Sum Utilized</Label>
                                            <Input id="sumUtilized" name="sumUtilized" type="number" min="0" defaultValue={patient.sumUtilized ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="totalSum">Total Sum</Label>
                                            <Input id="totalSum" name="totalSum" type="number" min="0" value={totalSum} readOnly />
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
                                            <Select name="tpa_id" disabled={isLoading || tpas.length === 0} required defaultValue={patient.tpa_id?.toString() ?? undefined}>
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
                                                onDoctorSelect={handleDoctorSelect}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="treat_doc_number">Treating doctor’s contact <span className="text-destructive">*</span></Label>
                                            <PhoneInput name="treat_doc_number" value={doctorContact} onChange={setDoctorContact} required />
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
                                    <CardTitle>D. Clinical Information</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="natureOfIllness">Nature of illness / presenting complaints</Label>
                                            <Textarea id="natureOfIllness" name="natureOfIllness" defaultValue={patient.natureOfIllness ?? ''} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="clinicalFindings">Relevant clinical findings</Label>
                                            <Textarea id="clinicalFindings" name="clinicalFindings" defaultValue={patient.clinicalFindings ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ailmentDuration">Duration of present ailment (days)</Label>
                                            <Input id="ailmentDuration" name="ailmentDuration" type="number" min="0" defaultValue={patient.ailmentDuration ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="firstConsultationDate">Date of first consultation</Label>
                                            <Input id="firstConsultationDate" name="firstConsultationDate" type="date" defaultValue={patient.firstConsultationDate ?? ''} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="pastHistory">Past history of present ailment</Label>
                                            <Textarea id="pastHistory" name="pastHistory" defaultValue={patient.pastHistory ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="provisionalDiagnosis">Provisional diagnosis</Label>
                                            <Input id="provisionalDiagnosis" name="provisionalDiagnosis" defaultValue={patient.provisionalDiagnosis ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icd10Codes">ICD-10 diagnosis code(s)</Label>
                                            <IctCodeSearch name="icd10Codes" defaultValue={patient.icd10Codes ?? ''} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Proposed line of treatment</Label>
                                            <div className="grid md:grid-cols-2 gap-4">
                                               <Input name="treatmentMedical" placeholder="Medical management" defaultValue={patient.treatmentMedical ?? ''} />
                                               <Input name="treatmentSurgical" placeholder="Surgical management" defaultValue={patient.treatmentSurgical ?? ''} />
                                               <Input name="treatmentIntensiveCare" placeholder="Intensive care" defaultValue={patient.treatmentIntensiveCare ?? ''} />
                                               <Input name="treatmentInvestigation" placeholder="Investigation only" defaultValue={patient.treatmentInvestigation ?? ''} />
                                               <Input name="treatmentNonAllopathic" placeholder="Non-allopathic" defaultValue={patient.treatmentNonAllopathic ?? ''} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="investigationDetails">Investigation / medical management details</Label>
                                            <Textarea id="investigationDetails" name="investigationDetails" defaultValue={patient.investigationDetails ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="drugRoute">Route of drug administration</Label>
                                            <Input id="drugRoute" name="drugRoute" defaultValue={patient.drugRoute ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="procedureName">Planned procedure / surgery name</Label>
                                            <Input id="procedureName" name="procedureName" defaultValue={patient.procedureName ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icd10PcsCodes">ICD-10-PCS / procedure code(s)</Label>
                                            <Input id="icd10PcsCodes" name="icd10PcsCodes" defaultValue={patient.icd10PcsCodes ?? ''} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="otherTreatments">Any other treatments (details)</Label>
                                            <Textarea id="otherTreatments" name="otherTreatments" defaultValue={patient.otherTreatments ?? ''} />
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
                                            <Input name="g" type="number" min="0" placeholder="G" defaultValue={patient.g ?? ''} />
                                            <Input name="p" type="number" min="0" placeholder="P" defaultValue={patient.p ?? ''} />
                                            <Input name="l" type="number" min="0" placeholder="L" defaultValue={patient.l ?? ''} />
                                            <Input name="a" type="number" min="0" placeholder="A" defaultValue={patient.a ?? ''} />
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
                                    <CardTitle>G. Admission &amp; Cost Estimate</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4" onBlurCapture={calculateTotalCost}>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionDate">Admission date</Label>
                                            <Input id="admissionDate" name="admissionDate" type="date" defaultValue={patient.admissionDate ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionTime">Admission time</Label>
                                            <Input id="admissionTime" name="admissionTime" type="time" defaultValue={patient.admissionTime ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionType">Type of admission</Label>
                                            <Input id="admissionType" name="admissionType" placeholder="e.g. Emergency, Planned" defaultValue={patient.admissionType ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedStay">Expected days of stay</Label>
                                            <Input id="expectedStay" name="expectedStay" type="number" min="0" defaultValue={patient.expectedStay ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedIcuStay">Expected days in ICU</Label>
                                            <Input id="expectedIcuStay" name="expectedIcuStay" type="number" min="0" defaultValue={patient.expectedIcuStay ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="roomCategory">Requested room category</Label>
                                             <Select name="roomCategory" defaultValue={patient.roomCategory ?? undefined}>
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
                                            <Label htmlFor="roomNursingDietCost">Room + Nursing + Diet (₹)</Label>
                                            <Input id="roomNursingDietCost" name="roomNursingDietCost" type="number" min="0" defaultValue={patient.roomNursingDietCost ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="investigationCost">Diagnostics/investigations cost (₹)</Label>
                                            <Input id="investigationCost" name="investigationCost" type="number" min="0" defaultValue={patient.investigationCost ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icuCost">ICU charges (₹)</Label>
                                            <Input id="icuCost" name="icuCost" type="number" min="0" defaultValue={patient.icuCost ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otCost">OT charges (₹)</Label>
                                            <Input id="otCost" name="otCost" type="number" min="0" defaultValue={patient.otCost ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="professionalFees">Professional fees (₹)</Label>
                                            <Input id="professionalFees" name="professionalFees" type="number" min="0" defaultValue={patient.professionalFees ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="medicineCost">Medicines + consumables (₹)</Label>
                                            <Input id="medicineCost" name="medicineCost" type="number" min="0" defaultValue={patient.medicineCost ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otherHospitalExpenses">Other hospital expenses (₹)</Label>
                                            <Input id="otherHospitalExpenses" name="otherHospitalExpenses" type="number" min="0" defaultValue={patient.otherHospitalExpenses ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="packageCharges">All-inclusive package charges (₹)</Label>
                                            <Input id="packageCharges" name="packageCharges" type="number" min="0" defaultValue={patient.packageCharges ?? ''} />
                                        </div>
                                        <div className="space-y-2 md:col-span-3">
                                            <Label htmlFor="totalExpectedCost">Total expected cost (₹)</Label>
                                            <Input id="totalExpectedCost" name="totalExpectedCost" type="number" min="0" value={totalCost} readOnly className="font-bold text-lg" />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                        
                        <Card>
                            <AccordionItem value="chief-complaints">
                                <AccordionTrigger className="p-6">
                                    <CardTitle>H. Medical History</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent>
                                         <ChiefComplaintForm initialData={chiefComplaints} patientId={id} />
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
