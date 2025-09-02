
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddPatient, handleUploadPatientFile, getNewPatientPageData, Doctor } from "../actions";
import Link from "next/link";
import { ArrowLeft, Upload, User as UserIcon, Loader2, Eye, Check, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Company, TPA } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IctCodeSearch } from "@/components/ict-code-search";
import { ChiefComplaintForm } from "@/components/chief-complaint-form";
import { PhoneInput } from "@/components/phone-input";
import { DoctorSearch } from "@/components/doctor-search";
import { PreAuthMedicalHistory } from "@/components/pre-auths/preauth-medical-history";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        &lt;Button type="submit" disabled={pending} size="lg"&gt;
            {pending ? "Saving..." : "Add Patient Record"}
        &lt;/Button&gt;
    );
}

const FileUploadField = React.memo(({ label, name, onUploadComplete }: { label: string; name: string, onUploadComplete: (fieldName: string, name: string, url: string) =&gt; void }) =&gt; {
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState&lt;string | null&gt;(null);
    const { toast } = useToast();
    const fileInputRef = useRef&lt;HTMLInputElement&gt;(null);

    const handleFileChange = async (event: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', name); // e.g. 'adhaar_path'
            
            const result = await handleUploadPatientFile(formData);

            if (fileInputRef.current) { // Check if not cancelled
                if (result.type === 'success' && result.url) {
                    setFileUrl(result.url);
                    onUploadComplete(name, result.name, result.url);
                    toast({ title: "Success", description: `${label} uploaded.`, variant: "success" });
                } else if(result.type === 'error') {
                    toast({ title: "Error", description: result.message, variant: "destructive" });
                }
                setIsUploading(false);
            }
        }
    };
    
    const handleCancelUpload = () =&gt; {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
        toast({ title: "Cancelled", description: "File upload has been cancelled.", variant: "default" });
    };

    return (
        &lt;div className="space-y-2"&gt;
            &lt;Label htmlFor={name}&gt;{label}&lt;/Label&gt;
            &lt;div className="flex items-center gap-2"&gt;
                &lt;Input ref={fileInputRef} id={name} name={`${name}-file`} type="file" onChange={handleFileChange} disabled={isUploading} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" /&gt;
                {isUploading && (
                     &lt;div className="flex items-center gap-2"&gt;
                        &lt;Loader2 className="h-5 w-5 animate-spin" /&gt;
                        &lt;Button variant="ghost" size="icon" onClick={handleCancelUpload}&gt;
                            &lt;XCircle className="h-5 w-5 text-destructive" /&gt;
                        &lt;/Button&gt;
                    &lt;/div&gt;
                )}
                {fileUrl && !isUploading && (
                     &lt;Button variant="outline" size="icon" asChild&gt;
                        &lt;Link href={fileUrl} target="_blank"&gt;
                            &lt;Eye className="h-4 w-4" /&gt;
                        &lt;/Link&gt;
                    &lt;/Button&gt;
                )}
            &lt;/div&gt;
        &lt;/div&gt;
    );
});
FileUploadField.displayName = 'FileUploadField';


export default function NewPatientPage() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddPatient, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [companies, setCompanies] = useState&lt;Pick&lt;Company, "id" | "name"&gt;[]&gt;([]);
    const [tpas, setTpas] = useState&lt;Pick&lt;TPA, "id" | "name"&gt;[]&gt;([]);
    const [doctors, setDoctors] = useState&lt;Doctor[]&gt;([]);
    const [isLoading, setIsLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState&lt;string | null&gt;(null);
    const [photoName, setPhotoName] = useState&lt;string | null&gt;(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef&lt;HTMLInputElement&gt;(null);
    const [documentUrls, setDocumentUrls] = useState&lt;Record&lt;string, { url: string, name: string }&gt;&gt;({});
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

    const calculateTotalCost = React.useCallback(() =&gt; {
        const form = document.querySelector('form');
        if (!form) return;
        const costs = [
            'roomNursingDietCost', 'investigationCost', 'icuCost',
            'otCost', 'professionalFees', 'medicineCost', 'otherHospitalExpenses'
        ];
        let sum = 0;
        costs.forEach(id =&gt; {
            const input = form.querySelector(`#${id}`) as HTMLInputElement;
            if (input && input.value) {
                sum += parseFloat(input.value) || 0;
            }
        });
        setTotalCost(sum);
    }, []);

    useEffect(() =&gt; {
        calculateTotalCost();
    }, [calculateTotalCost]); 

    
    useEffect(() =&gt; {
        async function loadData() {
            try {
                const { companies, tpas, doctors } = await getNewPatientPageData();
                setCompanies(companies);
                setTpas(tpas);
                setDoctors(doctors);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load required data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [toast]);
    
    useEffect(() =&gt; {
        if (state.type === 'success') {
            toast({ title: "Patient", description: state.message, variant: "success" });
            router.push('/dashboard/patients');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);

    const handlePhotoChange = async (event: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploadingPhoto(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', 'photo');
            const result = await handleUploadPatientFile(formData);

            if (photoInputRef.current) { // Check if not cancelled
                if (result.type === 'success' && result.url) {
                    setPhotoUrl(result.url);
                    setPhotoName(result.name)
                    toast({ title: "Success", description: "Photo uploaded.", variant: "success" });
                } else if(result.type === 'error') {
                    toast({ title: "Error", description: result.message, variant: "destructive" });
                }
                setIsUploadingPhoto(false);
            }
        }
    };
    
     const handleCancelPhotoUpload = () =&gt; {
        setIsUploadingPhoto(false);
        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        }
        toast({ title: "Cancelled", description: "Photo upload has been cancelled.", variant: "default" });
    };

    const handleDocumentUploadComplete = (fieldName: string, name: string, url: string) =&gt; {
        setDocumentUrls(prev =&gt; ({ ...prev, [fieldName]: { url, name } }));
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        &lt;div className="space-y-6"&gt;
            &lt;div className="flex items-center gap-4"&gt;
                &lt;Button variant="outline" size="icon" asChild&gt;
                    &lt;Link href="/dashboard/patients"&gt;
                        &lt;ArrowLeft className="h-4 w-4" /&gt;
                        &lt;span className="sr-only"&gt;Back&lt;/span&gt;
                    &lt;/Link&gt;
                &lt;/Button&gt;
                &lt;h1 className="text-lg font-semibold md:text-2xl"&gt;New Patient&lt;/h1&gt;
            &lt;/div&gt;
            &lt;form action={formAction}&gt;
                 &lt;input type="hidden" name="hospital_id" value={user?.hospitalId || ''} /&gt;
                 &lt;input type="hidden" name="photoUrl" value={photoUrl || ''} /&gt;
                 &lt;input type="hidden" name="photoName" value={photoName || ''} /&gt;
                 {Object.entries(documentUrls).map(([key, value]) =&gt; (
                    &lt;React.Fragment key={key}&gt;
                      &lt;input type="hidden" name={`${key}_url`} value={value.url} /&gt;
                      &lt;input type="hidden" name={`${key}_name`} value={value.name} /&gt;
                    &lt;/React.Fragment&gt;
                 ))}
                &lt;div className="grid gap-6"&gt;
                    &lt;Card className="flex flex-col items-center p-6"&gt;
                        &lt;Avatar className="h-32 w-32 mb-4"&gt;
                            {isUploadingPhoto ? (
                                &lt;div className="flex h-full w-full items-center justify-center rounded-full bg-muted"&gt;
                                    &lt;Loader2 className="h-10 w-10 animate-spin" /&gt;
                                &lt;/div&gt;
                            ) : (
                                &lt;&gt;
                                    &lt;AvatarImage src={photoUrl ?? undefined} /&gt;
                                    &lt;AvatarFallback&gt;
                                        &lt;UserIcon className="h-16 w-16" /&gt;
                                    &lt;/AvatarFallback&gt;
                                &lt;/&gt;
                            )}
                        &lt;/Avatar&gt;
                        &lt;div className="flex items-center gap-2"&gt;
                            &lt;Button type="button" variant="outline" onClick={() =&gt; photoInputRef.current?.click()} disabled={isUploadingPhoto}&gt;
                                &lt;Upload className="mr-2 h-4 w-4" /&gt;
                                {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                            &lt;/Button&gt;
                            {isUploadingPhoto && (
                                &lt;Button type="button" variant="ghost" size="icon" onClick={handleCancelPhotoUpload}&gt;
                                    &lt;XCircle className="h-6 w-6 text-destructive" /&gt;
                                &lt;/Button&gt;
                            )}
                        &lt;/div&gt;
                        &lt;Input 
                            ref={photoInputRef}
                            id="photo-upload" 
                            name="photo-upload-file" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoChange} 
                        /&gt;
                    &lt;/Card&gt;
                    &lt;Accordion type="multiple" className="w-full space-y-6" defaultValue={["patient-details", "insurance-details"]}&gt;
                    {&lt;!-- Patient Details --&gt;}
                    &lt;Card&gt;
                        &lt;AccordionItem value="patient-details"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;A. Patient Details&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                &lt;CardContent className="grid md:grid-cols-3 gap-4"&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="firstName"&gt;First Name &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="firstName" name="firstName" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="lastName"&gt;Last Name &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="lastName" name="lastName" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="email_address"&gt;Email Address &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="email_address" name="email_address" type="email" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="phone_number"&gt;Registered mobile number &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;PhoneInput name="phone_number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="alternative_number"&gt;Alternate contact number&lt;/Label&gt;
                                        &lt;PhoneInput name="alternative_number" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="gender"&gt;Gender &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Select name="gender" required&gt;
                                            &lt;SelectTrigger&gt;&lt;SelectValue placeholder="Select gender" /&gt;&lt;/SelectTrigger&gt;
                                            &lt;SelectContent&gt;
                                                &lt;SelectItem value="Male"&gt;Male&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Female"&gt;Female&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Other"&gt;Other&lt;/SelectItem&gt;
                                            &lt;/SelectContent&gt;
                                        &lt;/Select&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="age"&gt;Age&lt;/Label&gt;
                                        &lt;Input id="age" name="age" type="number" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="birth_date"&gt;Date of birth&lt;/Label&gt;
                                        &lt;Input id="birth_date" name="birth_date" type="date" max={today} /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="md:col-span-2 space-y-2"&gt;
                                        &lt;Label htmlFor="address"&gt;Address &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="address" name="address" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="occupation"&gt;Occupation&lt;/Label&gt;
                                        &lt;Input id="occupation" name="occupation" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="employee_id"&gt;Employee ID&lt;/Label&gt;
                                        &lt;Input id="employee_id" name="employee_id" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="abha_id"&gt;ABHA ID&lt;/Label&gt;
                                        &lt;Input id="abha_id" name="abha_id" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="health_id"&gt;Health ID / UHID &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="health_id" name="health_id" required /&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                     &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;AccordionItem value="kyc-documents"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;B. KYC &amp;amp; Documents&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                &lt;CardContent className="grid md:grid-cols-2 gap-4"&gt;
                                    &lt;FileUploadField label="Aadhaar Card" name="adhaar_path" onUploadComplete={handleDocumentUploadComplete} /&gt;
                                    &lt;FileUploadField label="PAN Card" name="pan_path" onUploadComplete={handleDocumentUploadComplete} /&gt;
                                    &lt;FileUploadField label="Passport" name="passport_path" onUploadComplete={handleDocumentUploadComplete} /&gt;
                                    &lt;FileUploadField label="Driving License" name="driving_licence_path" onUploadComplete={handleDocumentUploadComplete} /&gt;
                                    &lt;FileUploadField label="Voter ID" name="voter_id_path" onUploadComplete={handleDocumentUploadComplete} /&gt;
                                    &lt;FileUploadField label="Other Document" name="other_path" onUploadComplete={handleDocumentUploadComplete} /&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;

                    {&lt;!-- Insurance Details --&gt;}
                    &lt;Card&gt;
                         &lt;AccordionItem value="insurance-details"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;C. Insurance &amp;amp; Admission Details&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                &lt;CardContent className="grid md:grid-cols-3 gap-4"&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="admission_id"&gt;Admission ID &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="admission_id" name="admission_id" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="relationship_policyholder"&gt;Relationship to policyholder &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Select name="relationship_policyholder" required&gt;
                                            &lt;SelectTrigger&gt;&lt;SelectValue placeholder="Select relationship" /&gt;&lt;/SelectTrigger&gt;
                                            &lt;SelectContent&gt;
                                                &lt;SelectItem value="Sister"&gt;Sister&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Brother"&gt;Brother&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Mother"&gt;Mother&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Father"&gt;Father&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Son"&gt;Son&lt;/SelectItem&gt;
                                                &lt;SelectItem value="Daughter"&gt;Daughter&lt;/SelectItem&gt;
                                            &lt;/SelectContent&gt;
                                        &lt;/Select&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="policy_number"&gt;Policy number &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="policy_number" name="policy_number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="insured_card_number"&gt;Insured member / card ID number &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="insured_card_number" name="insured_card_number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="company_id"&gt;Insurance Company &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Select name="company_id" required disabled={isLoading}&gt;
                                            &lt;SelectTrigger&gt;&lt;SelectValue placeholder="Select a company" /&gt;&lt;/SelectTrigger&gt;
                                            &lt;SelectContent&gt;
                                                {companies.map(c =&gt; (
                                                    &lt;SelectItem key={c.id} value={c.id}&gt;{c.name}&lt;/SelectItem&gt;
                                                ))}
                                            &lt;/SelectContent&gt;
                                        &lt;/Select&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="policy_start_date"&gt;Policy Start Date &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="policy_start_date" name="policy_start_date" type="date" required max={today} /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="policy_end_date"&gt;Policy End Date &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="policy_end_date" name="policy_end_date" type="date" required min={today} /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="sumInsured"&gt;Sum Insured&lt;/Label&gt;
                                        &lt;Input id="sumInsured" name="sumInsured" type="number" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="sumUtilized"&gt;Sum Utilized&lt;/Label&gt;
                                        &lt;Input id="sumUtilized" name="sumUtilized" type="number" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="totalSum"&gt;Total Sum&lt;/Label&gt;
                                        &lt;Input id="totalSum" name="totalSum" type="number" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="corporate_policy_number"&gt;Corporate policy name/number&lt;/Label&gt;
                                        &lt;Input id="corporate_policy_number" name="corporate_policy_number" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="other_policy_name"&gt;Other active health insurance&lt;/Label&gt;
                                        &lt;Input id="other_policy_name" name="other_policy_name" placeholder="Name of other insurer" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="family_doctor_name"&gt;Family physician name&lt;/Label&gt;
                                        &lt;Input id="family_doctor_name" name="family_doctor_name" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="family_doctor_phone"&gt;Family physician contact&lt;/Label&gt;
                                        &lt;PhoneInput name="family_doctor_phone" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="payer_email"&gt;Proposer/Payer email ID &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="payer_email" name="payer_email" type="email" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="payer_phone"&gt;Proposer/Payer phone number &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;PhoneInput name="payer_phone" required /&gt;
                                    &lt;/div&gt;
                                     &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="tpa_id"&gt;Select TPA &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Select name="tpa_id" disabled={isLoading} required&gt;
                                            &lt;SelectTrigger&gt;&lt;SelectValue placeholder="Select a TPA" /&gt;&lt;/SelectTrigger&gt;
                                            &lt;SelectContent&gt;
                                                {tpas.map(t =&gt; (
                                                    &lt;SelectItem key={t.id} value={String(t.id)}&gt;{t.name}&lt;/SelectItem&gt;
                                                ))}
                                            &lt;/SelectContent&gt;
                                        &lt;/Select&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="treat_doc_name"&gt;Treating doctor’s name &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;DoctorSearch doctors={doctors} /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="treat_doc_number"&gt;Treating doctor’s contact &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;PhoneInput id="treat_doc_number" name="treat_doc_number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="treat_doc_qualification"&gt;Doctor’s qualification &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="treat_doc_qualification" name="treat_doc_qualification" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="treat_doc_reg_no"&gt;Doctor’s registration no. &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="treat_doc_reg_no" name="treat_doc_reg_no" required /&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;AccordionItem value="clinical-info"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;D. Clinical Information &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                &lt;CardContent className="grid md:grid-cols-2 gap-4"&gt;
                                    &lt;div className="space-y-2 md:col-span-2"&gt;
                                        &lt;Label htmlFor="natureOfIllness"&gt;Nature of illness / presenting complaints &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Textarea id="natureOfIllness" name="natureOfIllness" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2 md:col-span-2"&gt;
                                        &lt;Label htmlFor="clinicalFindings"&gt;Relevant clinical findings &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Textarea id="clinicalFindings" name="clinicalFindings" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="ailmentDuration"&gt;Duration of present ailment (days) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="ailmentDuration" name="ailmentDuration" type="number" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="firstConsultationDate"&gt;Date of first consultation &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="firstConsultationDate" name="firstConsultationDate" type="date" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2 md:col-span-2"&gt;
                                        &lt;Label htmlFor="pastHistory"&gt;Past history of present ailment &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Textarea id="pastHistory" name="pastHistory" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="provisionalDiagnosis"&gt;Provisional diagnosis &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="provisionalDiagnosis" name="provisionalDiagnosis" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="icd10Codes"&gt;ICD-10 diagnosis code(s) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;IctCodeSearch name="icd10Codes" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2 md:col-span-2"&gt;
                                        &lt;Label&gt;Proposed line of treatment &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;div className="grid md:grid-cols-2 gap-4"&gt;
                                            &lt;Input name="treatmentMedical" placeholder="Medical management" required/&gt;
                                            &lt;Input name="treatmentSurgical" placeholder="Surgical management" required/&gt;
                                            &lt;Input name="treatmentIntensiveCare" placeholder="Intensive care" required/&gt;
                                            &lt;Input name="treatmentInvestigation" placeholder="Investigation only" required/&gt;
                                            &lt;Input name="treatmentNonAllopathic" placeholder="Non-allopathic" required/&gt;
                                        &lt;/div&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="investigationDetails"&gt;Investigation / medical management details &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Textarea id="investigationDetails" name="investigationDetails" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="drugRoute"&gt;Route of drug administration &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="drugRoute" name="drugRoute" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="procedureName"&gt;Planned procedure / surgery name &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="procedureName" name="procedureName" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="icd10PcsCodes"&gt;ICD-10-PCS / procedure code(s) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="icd10PcsCodes" name="icd10PcsCodes" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2 md:col-span-2"&gt;
                                        &lt;Label htmlFor="otherTreatments"&gt;Any other treatments (details) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Textarea id="otherTreatments" name="otherTreatments" required/&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;AccordionItem value="accident-info"&gt;
                                &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;E. Accident / Medico-Legal&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                &lt;CardContent className="grid md:grid-cols-3 gap-4"&gt;
                                    &lt;div className="flex items-center space-x-2"&gt;
                                        &lt;Checkbox id="isInjury" name="isInjury" /&gt;
                                        &lt;Label htmlFor="isInjury"&gt;Due to injury/accident?&lt;/Label&gt;
                                    &lt;/div&gt;
                                        &lt;div className="space-y-2 md:col-span-2"&gt;
                                        &lt;Label htmlFor="injuryCause"&gt;How did injury occur?&lt;/Label&gt;
                                        &lt;Input id="injuryCause" name="injuryCause" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="flex items-center space-x-2"&gt;
                                        &lt;Checkbox id="isRta" name="isRta" /&gt;
                                        &lt;Label htmlFor="isRta"&gt;Road Traffic Accident?&lt;/Label&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="injuryDate"&gt;Date of injury&lt;/Label&gt;
                                        &lt;Input id="injuryDate" name="injuryDate" type="date" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="flex items-center space-x-2"&gt;
                                        &lt;Checkbox id="isReportedToPolice" name="isReportedToPolice" /&gt;
                                        &lt;Label htmlFor="isReportedToPolice"&gt;Reported to police?&lt;/Label&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="firNumber"&gt;FIR number&lt;/Label&gt;
                                        &lt;Input id="firNumber" name="firNumber" /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="flex items-center space-x-2"&gt;
                                        &lt;Checkbox id="isAlcoholSuspected" name="isAlcoholSuspected" /&gt;
                                        &lt;Label htmlFor="isAlcoholSuspected"&gt;Alcohol/substance use?&lt;/Label&gt;
                                    &lt;/div&gt;
                                    &lt;div className="flex items-center space-x-2"&gt;
                                        &lt;Checkbox id="isToxicologyConducted" name="isToxicologyConducted" /&gt;
                                        &lt;Label htmlFor="isToxicologyConducted"&gt;Toxicology test done?&lt;/Label&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;
                    
                    &lt;Card&gt;
                        &lt;AccordionItem value="maternity-info"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;F. Maternity&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                &lt;CardContent className="grid md:grid-cols-3 gap-4"&gt;
                                        &lt;div className="flex items-center space-x-2"&gt;
                                        &lt;Checkbox id="isMaternity" name="isMaternity" /&gt;
                                        &lt;Label htmlFor="isMaternity"&gt;Is this a maternity case?&lt;/Label&gt;
                                    &lt;/div&gt;
                                    &lt;div className="grid grid-cols-4 gap-2 md:col-span-2"&gt;
                                        &lt;Input name="g" type="number" placeholder="G" /&gt;
                                        &lt;Input name="p" type="number" placeholder="P" /&gt;
                                        &lt;Input name="l" type="number" placeholder="L" /&gt;
                                        &lt;Input name="a" type="number" placeholder="A" /&gt;
                                    &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="expectedDeliveryDate"&gt;Expected date of delivery&lt;/Label&gt;
                                        &lt;Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" /&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;AccordionItem value="cost-info"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;G. Admission &amp;amp; Cost Estimate &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                    &lt;CardContent className="grid md:grid-cols-3 gap-4" onBlurCapture={calculateTotalCost}&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="admissionDate"&gt;Admission date &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="admissionDate" name="admissionDate" type="date" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="admissionTime"&gt;Admission time &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="admissionTime" name="admissionTime" type="time" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="admissionType"&gt;Type of admission &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="admissionType" name="admissionType" placeholder="e.g. Emergency, Planned" required/&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="expectedStay"&gt;Expected days of stay &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="expectedStay" name="expectedStay" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="expectedIcuStay"&gt;Expected days in ICU &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="expectedIcuStay" name="expectedIcuStay" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="roomCategory"&gt;Requested room category &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Select name="roomCategory" required&gt;
                                            &lt;SelectTrigger&gt;
                                                &lt;SelectValue placeholder="Select a room category" /&gt;
                                            &lt;/SelectTrigger&gt;
                                            &lt;SelectContent&gt;
                                                {roomCategories.map(category =&gt; (
                                                    &lt;SelectItem key={category} value={category}&gt;{category}&lt;/SelectItem&gt;
                                                ))}
                                            &lt;/SelectContent&gt;
                                        &lt;/Select&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="roomNursingDietCost"&gt;Room + Nursing + Diet (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="roomNursingDietCost" name="roomNursingDietCost" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="investigationCost"&gt;Diagnostics/investigations cost (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="investigationCost" name="investigationCost" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="icuCost"&gt;ICU charges (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="icuCost" name="icuCost" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="otCost"&gt;OT charges (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="otCost" name="otCost" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="professionalFees"&gt;Professional fees (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="professionalFees" name="professionalFees" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="medicineCost"&gt;Medicines + consumables (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="medicineCost" name="medicineCost" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="otherHospitalExpenses"&gt;Other hospital expenses (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="otherHospitalExpenses" name="otherHospitalExpenses" type="number" required /&gt;
                                    &lt;/div&gt;
                                    &lt;div className="space-y-2"&gt;
                                        &lt;Label htmlFor="packageCharges"&gt;All-inclusive package charges (₹) &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                        &lt;Input id="packageCharges" name="packageCharges" type="number" required /&gt;
                                    &lt;/div&gt;
                                        &lt;div className="space-y-2 md:col-span-3"&gt;
                                        &lt;Label htmlFor="totalExpectedCost"&gt;Total expected cost (₹)&lt;/Label&gt;
                                        &lt;Input id="totalExpectedCost" name="totalExpectedCost" type="number" value={totalCost} readOnly className="font-bold text-lg" /&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;
                        
                    &lt;ChiefComplaintForm /&gt;
                        
                    &lt;Card&gt;
                        &lt;AccordionItem value="declarations-info"&gt;
                            &lt;AccordionTrigger className="p-6"&gt;
                                &lt;CardTitle&gt;I. Declarations &amp;amp; Attachments &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/CardTitle&gt;
                            &lt;/AccordionTrigger&gt;
                            &lt;AccordionContent&gt;
                                    &lt;CardContent className="space-y-4"&gt;
                                    &lt;div className="grid md:grid-cols-3 gap-4"&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="patientDeclarationName"&gt;Patient/insured name &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="patientDeclarationName" name="patientDeclarationName" required /&gt;
                                        &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="patientDeclarationContact"&gt;Contact number &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;PhoneInput name="patientDeclarationContact" required /&gt;
                                        &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="patientDeclarationEmail"&gt;Email ID &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="patientDeclarationEmail" name="patientDeclarationEmail" type="email" required /&gt;
                                        &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="patientDeclarationDate"&gt;Declaration date &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="patientDeclarationDate" name="patientDeclarationDate" type="date" required /&gt;
                                        &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="patientDeclarationTime"&gt;Declaration time &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="patientDeclarationTime" name="patientDeclarationTime" type="time" required /&gt;
                                        &lt;/div&gt;
                                    &lt;/div&gt;
                                        &lt;div className="grid md:grid-cols-3 gap-4 border-t pt-4"&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="hospitalDeclarationDoctorName"&gt;Hospital declaration – doctor name &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="hospitalDeclarationDoctorName" name="hospitalDeclarationDoctorName" required /&gt;
                                        &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="hospitalDeclarationDate"&gt;Declaration date &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="hospitalDeclarationDate" name="hospitalDeclarationDate" type="date" required /&gt;
                                        &lt;/div&gt;
                                        &lt;div className="space-y-2"&gt;
                                            &lt;Label htmlFor="hospitalDeclarationTime"&gt;Declaration time &lt;span className="text-destructive"&gt;*&lt;/span&gt;&lt;/Label&gt;
                                            &lt;Input id="hospitalDeclarationTime" name="hospitalDeclarationTime" type="time" required /&gt;
                                        &lt;/div&gt;
                                    &lt;/div&gt;
                                        &lt;div className="space-y-2 pt-4 border-t"&gt;
                                        &lt;Label&gt;Attachments to enclose&lt;/Label&gt;
                                        &lt;div className="grid grid-cols-2 md:grid-cols-3 gap-2"&gt;
                                            {['ID proof', 'Policy copy', 'Doctor’s notes', 'Investigations', 'Estimate'].map(item =&gt; (
                                                     &lt;div key={item} className="flex items-center space-x-2"&gt;
                                                        &lt;Checkbox id={`att-${item}`} name="attachments" value={item} /&gt;
                                                        &lt;Label htmlFor={`att-${item}`} className="font-normal"&gt;{item}&lt;/Label&gt;
                                                    &lt;/div&gt;
                                                ))}
                                        &lt;/div&gt;
                                    &lt;/div&gt;
                                &lt;/CardContent&gt;
                            &lt;/AccordionContent&gt;
                        &lt;/AccordionItem&gt;
                    &lt;/Card&gt;
                    &lt;/Accordion&gt;


                    &lt;div className="flex justify-end"&gt;
                      {state.type === 'error' && &lt;p className="text-sm text-destructive self-center mr-4"&gt;{state.message}&lt;/p&gt;}
                      &lt;SubmitButton /&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/form&gt;
        &lt;/div&gt;
    );
}

    