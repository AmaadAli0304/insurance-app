

"use client";

import { useState, useActionState, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddRequest, handleSaveDraftRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, Send, Check, Save, File as FileIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { getPatientWithDetailsForForm, getPatientsForPreAuth } from "@/app/dashboard/patients/actions";
import { getHospitalById } from "@/app/dashboard/company-hospitals/actions";
import type { Patient, Hospital } from "@/lib/types";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Complaint } from "@/components/chief-complaint-form";
import { PreAuthMedicalHistory } from "@/components/pre-auths/preauth-medical-history";


const Editor = dynamic(
  () => import('react-draft-wysiwyg').then(mod => mod.Editor),
  { ssr: false }
);

let htmlToDraft: any = null;
if (typeof window === 'object') {
  htmlToDraft = require('html-to-draftjs').default;
}

function SubmitButton({ formAction }: { formAction: (payload: FormData) => void }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} formAction={formAction}>
            <Send className="mr-2 h-4 w-4" />
            {pending ? "Sending..." : "Save & Send Request"}
        </Button>
    );
}

export default function NewRequestPage() {
    const { user } = useAuth();
    const [addState, addAction] = useActionState(handleAddRequest, { message: "", type: "initial" });
    const [draftState, draftAction] = useActionState(handleSaveDraftRequest, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
    const [hospitalDetails, setHospitalDetails] = useState<Hospital | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);
    const [hospitalPatients, setHospitalPatients] = useState<{ id: string; fullName: string; admission_id: string; }[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchListOpen, setIsSearchListOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const pdfFormRef = useRef<HTMLDivElement>(null);
    
    const [totalCost, setTotalCost] = useState(0);
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [emailBody, setEmailBody] = useState("");
    const [subject, setSubject] = useState("");
    const [requestType, setRequestType] = useState("pre-auth");
    const [toEmail, setToEmail] = useState("");
    const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);

    useEffect(() => {
        setEmailBody(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    }, [editorState]);

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
        if (!pdfFormRef.current) return;
        const costs = [
            'roomNursingDietCost', 'investigationCost', 'icuCost',
            'otCost', 'professionalFees', 'medicineCost', 'otherHospitalExpenses', 'packageCharges'
        ];
        let sum = 0;
        costs.forEach(id => {
            const input = pdfFormRef.current?.querySelector(`#${id}`) as HTMLInputElement;
            if (input && input.value) {
                sum += parseFloat(input.value) || 0;
            }
        });
        setTotalCost(sum);
    }, []);
    
    const handleDownloadPdf = async () => {
        const formToCapture = pdfFormRef.current;
        if (!formToCapture || !patientDetails) {
            toast({
                title: "Error",
                description: "Cannot download PDF. Please select a patient first.",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Generating PDF",
            description: "Please wait while the PDF is being created...",
        });

        const canvas = await html2canvas(formToCapture, {
            scale: 2, // Increase scale for better resolution
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const height = pdfWidth / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
        pdf.save(`pre-auth-request-${patientDetails.fullName.replace(/ /g, '_')}.pdf`);
    };
    
    useEffect(() => {
        const state = addState.type === 'initial' ? draftState : addState;
        if (state.type === 'success') {
            toast({
                title: "Pre-Authorization",
                description: state.message,
                variant: "success",
            });
            router.push('/dashboard/pre-auths');
        } else if (state.type === 'error') {
            toast({
                title: "Error",
                description: state.message,
                variant: "destructive"
            });
        }
    }, [addState, draftState, toast, router]);

    useEffect(() => {
        if (!user?.hospitalId) return;

        async function loadInitialData() {
            try {
                const [patients, hospital] = await Promise.all([
                   getPatientsForPreAuth(user!.hospitalId!),
                   getHospitalById(user!.hospitalId!)
                ]);

                setHospitalPatients(patients);
                setHospitalDetails(hospital);

                const patientIdFromUrl = searchParams.get('patientId');
                if (patientIdFromUrl) {
                    const preselectedPatient = patients.find(p => String(p.id) === patientIdFromUrl);
                    if (preselectedPatient) {
                        setSelectedPatientId(preselectedPatient.id);
                        setSearchQuery(`${preselectedPatient.fullName} - ${preselectedPatient.admission_id}`);
                    }
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch initial data.", variant: 'destructive' });
            }
        }
        
        loadInitialData();

    }, [user?.hospitalId, searchParams, toast]);


    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedPatientId) {
                setPatientDetails(null);
                setToEmail("");
                setTotalCost(0);
                return;
            }
            setIsLoadingPatient(true);
            try {
                const details = await getPatientWithDetailsForForm(selectedPatientId);
                setPatientDetails(details);
                 if (details) {
                    if (details.tpaEmail) {
                        setToEmail(details.tpaEmail);
                    }
                    const costFields: (keyof Patient)[] = [
                        'roomNursingDietCost', 'investigationCost', 'icuCost',
                        'otCost', 'professionalFees', 'medicineCost', 'otherHospitalExpenses', 'packageCharges'
                    ];
                    const sum = costFields.reduce((acc, field) => {
                        const value = details[field];
                        return acc + (typeof value === 'number' ? value : 0);
                    }, 0);
                    setTotalCost(sum);
                 }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch patient details.", variant: 'destructive' });
            } finally {
                setIsLoadingPatient(false);
            }
        };
        fetchDetails();
    }, [selectedPatientId, toast]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchListOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredPatients = useMemo(() => {
        if (!searchQuery) return [];
        const exactMatch = hospitalPatients.some(p => `${p.fullName} - ${p.admission_id}` === searchQuery);
        if (exactMatch && selectedPatientId) return [];

        return hospitalPatients.filter(p => 
            `${p.fullName} - ${p.admission_id}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, hospitalPatients, selectedPatientId]);


    const handlePatientSelect = (patient: { id: string; fullName: string; admission_id: string; }) => {
        setSelectedPatientId(patient.id);
        setSearchQuery(`${patient.fullName} - ${patient.admission_id}`);
        setIsSearchListOpen(false);
    };

    const formatDateForInput = (dateString?: string | null) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'yyyy-MM-dd');
        } catch {
            return '';
        }
    };
    
    useEffect(() => {
        if (!patientDetails || !hospitalDetails || !htmlToDraft) return;

        const claimNo = patientDetails.admission_id || '[______]';
        const hospitalName = hospitalDetails.name || '[Hospital Name]';
        
        let newSubject = '';
        let newBodyHtml = '';

        if (requestType === 'pre-auth') {
            newSubject = `Pre-Authorization Request – Claim No. ${claimNo} | ${hospitalName}`;
            newBodyHtml = `<p>Dear Sir/Madam,</p><p>Greetings from ${hospitalName}.</p><p>Hope this email finds you well.</p><p>We are submitting a pre-authorization request under Claim No. ${claimNo} for your kind consideration and approval. Please find the details below:</p>
            <p><strong>Patient Details</strong></p>
            <ul>
                <li>Patient Name: ${patientDetails.fullName || '____________________'}</li>
                <li>Patient ID / Insurance No.: ${patientDetails.memberId || '____________________'}</li>
                <li>Date of Admission: ${patientDetails.admissionDate ? formatDateForInput(patientDetails.admissionDate) : '____________________'}</li>
                <li>Time of Admission: ${patientDetails.admissionTime || '____________________'}</li>
                <li>Admitting Consultant: ${patientDetails.treat_doc_name || '____________________'}</li>
                <li>Diagnosis / Treatment Proposed: ${patientDetails.provisionalDiagnosis || '____________________'}</li>
                <li>Room Category / Class: ${patientDetails.roomCategory || '____________________'}</li>
                <li>Estimated Length of Stay: ${patientDetails.expectedStay ? `${patientDetails.expectedStay} days` : '____________________'}</li>
            </ul>
            <p><strong>Estimated Financials</strong></p>
            <ul>
                <li>Estimated Cost of Treatment: ₹${totalCost.toLocaleString() || '__________________'}</li>
                <li>In Words: ____________________</li>
            </ul>
            <p>Breakup of Estimated Charges:</p>
            <ul>
                <li>Room Charges: ${patientDetails.roomNursingDietCost || '____________________'}</li>
                <li>Doctor Visit Charges: ${patientDetails.professionalFees || '____________________'}</li>
                <li>Medicine Charges: ${patientDetails.medicineCost || '____________________'}</li>
                <li>Consumables / Disposables: ____________________</li>
                <li>Investigations: ${patientDetails.investigationCost || '____________________'}</li>
                <li>Blood Charges: ____________________</li>
                <li>Procedure Charges: ${patientDetails.packageCharges || '____________________'}</li>
            </ul>
            <p>We request you to kindly process this pre-authorization request at the earliest to facilitate the patient’s admission and treatment.</p>
            <p>Please find attached the required supporting documents and medical reports for your review.</p>
            <p>Thank you for your prompt attention and support.</p>
            <br/>
            <p>Warm Regards,</p>
            <br/>
            <p>${user?.name || '[Staff Name]'}</p>
            <p>${user?.designation || '[Designation]'}</p>
            <p>${hospitalName}</p>
            <p>${user?.number || '[Contact No.]'}</p>`;
        } else if (requestType === 'surgical') {
             newSubject = `Surgical Pre-Authorization Request – Claim No. ${claimNo} | ${hospitalName}`;
             newBodyHtml = `<p>Dear Sir/Madam,</p><p>Greetings from ${hospitalName}.</p><p>Hope this email finds you well.</p><p>We are submitting a surgical pre-authorization request under Claim No. ${claimNo} for your kind consideration and approval. Please find the details below:</p>
            <p><strong>Patient Details</strong></p>
            <ul>
                <li>Patient Name: ${patientDetails.fullName || '____________________'}</li>
                <li>Patient ID / Insurance No.: ${patientDetails.memberId || '____________________'}</li>
                <li>Date of Admission: ${patientDetails.admissionDate ? formatDateForInput(patientDetails.admissionDate) : '____________________'}</li>
                <li>Time of Admission: ${patientDetails.admissionTime || '____________________'}</li>
                <li>Admitting Consultant / Surgeon: ${patientDetails.treat_doc_name || '____________________'}</li>
                <li>Diagnosis: ${patientDetails.provisionalDiagnosis || '____________________'}</li>
                <li>Proposed Surgery / Procedure: ${patientDetails.procedureName || '____________________'}</li>
                <li>Scheduled Date & Time of Surgery: ____________________</li>
                <li>Room Category / Class: ${patientDetails.roomCategory || '____________________'}</li>
                <li>Estimated Length of Stay: ${patientDetails.expectedStay ? `${patientDetails.expectedStay} days` : '____________________'}</li>
            </ul>
            <p><strong>Estimated Financials</strong></p>
            <ul>
                <li>Estimated Cost of Surgery & Hospitalization: ₹${totalCost.toLocaleString() || '__________________'}</li>
                <li>In Words: ____________________</li>
            </ul>
            <p>Breakup of Estimated Charges:</p>
            <ul>
                <li>Room & Nursing Charges: ${patientDetails.roomNursingDietCost || '____________________'}</li>
                <li>Surgeon Fees: ${patientDetails.professionalFees || '____________________'}</li>
                <li>Assistant Surgeon Fees: ____________________</li>
                <li>Anesthetist Fees: ____________________</li>
                <li>Operation Theatre Charges: ${patientDetails.otCost || '____________________'}</li>
                <li>Implants / Prosthesis (if applicable): ____________________</li>
                <li>Medicines & Consumables: ${patientDetails.medicineCost || '____________________'}</li>
                <li>Investigations & Diagnostics: ${patientDetails.investigationCost || '____________________'}</li>
                <li>Blood & Transfusion Charges: ____________________</li>
                <li>Post-Operative Care Charges: ____________________</li>
                <li>Any Other (Specify): ____________________</li>
            </ul>
            <p>We request you to kindly process this surgical pre-authorization request at the earliest to ensure timely surgical intervention for the patient.</p>
            <p>Please find attached all supporting medical documents, investigation reports, and consent forms for your review.</p>
            <p>Thank you for your prompt attention and support.</p>
            <br/>
            <p>Warm Regards,</p>
            <br/>
            <p>${user?.name || '[Staff Name]'}</p>
            <p>${user?.designation || '[Designation]'}</p>
            <p>${hospitalName}</p>
            <p>${user?.number || '[Contact No.]'}</p>`;
        }

        setSubject(newSubject);
        
        const contentBlock = htmlToDraft(newBodyHtml);
        if (contentBlock) {
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            const newEditorState = EditorState.createWithContent(contentState);
            setEditorState(newEditorState);
        }

    }, [requestType, patientDetails, hospitalDetails, totalCost, user]);

    const documentFields: Array<{ key: keyof Patient, label: string }> = [
        { key: 'adhaar_path', label: 'Aadhaar Card' },
        { key: 'pan_path', label: 'PAN Card' },
        { key: 'passport_path', label: 'Passport' },
        { key: 'voter_id_path', label: 'Voter ID' },
        { key: 'driving_licence_path', label: 'Driving License' },
        { key: 'policy_path', label: 'Policy File' },
        { key: 'other_path', label: 'Other Document' },
        { key: 'discharge_summary_path', label: 'Discharge Summary' },
        { key: 'final_bill_path', label: 'Final Bill' },
        { key: 'pharmacy_bill_path', label: 'Pharmacy Bill' },
        { key: 'implant_bill_stickers_path', label: 'Implant Bill & Stickers' },
        { key: 'lab_bill_path', label: 'Lab Bill' },
        { key: 'ot_anesthesia_notes_path', label: 'OT & Anesthesia Notes' },
    ];


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/pre-auths">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Pre-Authorization</h1>
            </div>
            <form>
                 <input type="hidden" name="patientId" value={selectedPatientId || ''} />
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                 <input type="hidden" name="staff_id" value={user?.uid || ''} />
                 <input type="hidden" name="doctor_id" value={patientDetails?.doctor_id || ''} />
                 <input type="hidden" name="from" value={hospitalDetails?.email || user?.email || ''} />
                 <input type="hidden" name="to" value={toEmail} />
                 <input type="hidden" name="details" value={emailBody} />
                 <input type="hidden" name="requestType" value={requestType} />
                 <input type="hidden" name="totalExpectedCost" value={totalCost} />

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Patient</CardTitle>
                             <CardDescription>Search for a patient by name or admission ID to populate their details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div ref={searchContainerRef} className="relative">
                                <Label htmlFor="patient-search">Search Patient</Label>
                                <Input 
                                    id="patient-search"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value) {
                                            setIsSearchListOpen(true);
                                        }
                                        if (selectedPatientId) {
                                            setSelectedPatientId(null);
                                            setPatientDetails(null);
                                        }
                                    }}
                                    onFocus={() => setIsSearchListOpen(true)}
                                    placeholder="Search by name or admission ID..."
                                />
                                {isSearchListOpen && filteredPatients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                                        <ul className="max-h-60 overflow-auto">
                                            {filteredPatients.map(p => (
                                                <li 
                                                    key={p.id}
                                                    className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                                                    onClick={() => handlePatientSelect(p)}
                                                >
                                                   <span>{p.fullName} - {p.admission_id}</span>
                                                   {selectedPatientId === p.id && <Check className="h-4 w-4" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {isLoadingPatient && (
                        <div className="flex items-center justify-center rounded-lg border p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    <div ref={pdfFormRef}>
                    {patientDetails && (
                        <>
                        <Card>
                            <CardHeader>
                                <CardTitle>A. Patient Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                                    <Input id="firstName" name="first_name" defaultValue={patientDetails.firstName} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                                    <Input id="lastName" name="last_name" defaultValue={patientDetails.lastName} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email_address">Email Address <span className="text-destructive">*</span></Label>
                                    <Input id="email_address" name="email_address" type="email" defaultValue={patientDetails.email_address ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Registered mobile number <span className="text-destructive">*</span></Label>
                                    <PhoneInput name="phone_number" defaultValue={patientDetails.phoneNumber ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="alternative_number">Alternate contact number</Label>
                                    <PhoneInput name="alternative_number" defaultValue={patientDetails.alternative_number ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                                    <Select name="gender" defaultValue={patientDetails.gender ?? undefined} required>
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
                                    <Input id="age" name="age" type="number" defaultValue={patientDetails.age ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Date of birth</Label>
                                    <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDateForInput(patientDetails.dateOfBirth)} max={new Date().toISOString().split('T')[0]}/>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                                    <Input id="address" name="address" defaultValue={patientDetails.address ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Input id="occupation" name="occupation" defaultValue={patientDetails.occupation ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">Employee ID</Label>
                                    <Input id="employee_id" name="employee_id" defaultValue={patientDetails.employee_id ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="abha_id">ABHA ID</Label>
                                    <Input id="abha_id" name="abha_id" defaultValue={patientDetails.abha_id ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="health_id">Health ID / UHID <span className="text-destructive">*</span></Label>
                                    <Input id="health_id" name="health_id" defaultValue={patientDetails.health_id ?? ''} required/>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>B. Insurance & Admission Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admission_id">Admission ID <span className="text-destructive">*</span></Label>
                                    <Input id="admission_id" name="admission_id" defaultValue={patientDetails.admission_id ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="claim_id">Claim ID</Label>
                                    <Input id="claim_id" name="claim_id" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="relationship_policyholder">Relationship to policyholder <span className="text-destructive">*</span></Label>
                                    <Input id="relationship_policyholder" name="relationship_policyholder" defaultValue={patientDetails.relationship_policyholder ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_number">Policy number <span className="text-destructive">*</span></Label>
                                    <Input id="policy_number" name="policy_number" defaultValue={patientDetails.policyNumber ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="insured_card_number">Insured member / card ID number <span className="text-destructive">*</span></Label>
                                    <Input id="insured_card_number" name="insured_card_number" defaultValue={patientDetails.memberId ?? ''} required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="hospitalName">Hospital Name</Label>
                                    <Input id="hospitalName" name="hospitalName" defaultValue={hospitalDetails?.name ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Insurance Company</Label>
                                    <Input id="companyName" name="companyName" defaultValue={patientDetails.companyName ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_start_date">Policy Start Date <span className="text-destructive">*</span></Label>
                                    <Input id="policy_start_date" name="policy_start_date" type="date" defaultValue={formatDateForInput(patientDetails.policyStartDate)} required max={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_end_date">Policy End Date <span className="text-destructive">*</span></Label>
                                    <Input id="policy_end_date" name="policy_end_date" type="date" defaultValue={formatDateForInput(patientDetails.policyEndDate)} required min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sumInsured">Sum Insured</Label>
                                    <Input id="sumInsured" name="sumInsured" type="number" defaultValue={patientDetails.sumInsured ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sumUtilized">Sum Utilized</Label>
                                    <Input id="sumUtilized" name="sumUtilized" type="number" defaultValue={patientDetails.sumUtilized ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="totalSum">Total Sum</Label>
                                    <Input id="totalSum" name="totalSum" type="number" defaultValue={patientDetails.totalSum ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="corporate_policy_number">Corporate policy name/number</Label>
                                    <Input id="corporate_policy_number" name="corporate_policy_number" defaultValue={patientDetails.corporate_policy_number ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="other_policy_name">Other active health insurance</Label>
                                    <Input id="other_policy_name" name="other_policy_name" defaultValue={patientDetails.other_policy_name ?? ''} placeholder="Name of other insurer" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="family_doctor_name">Family physician name</Label>
                                    <Input id="family_doctor_name" name="family_doctor_name" defaultValue={patientDetails.family_doctor_name ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="family_doctor_phone">Family physician contact</Label>
                                    <PhoneInput name="family_doctor_phone" defaultValue={patientDetails.family_doctor_phone ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payer_email">Proposer/Payer email ID <span className="text-destructive">*</span></Label>
                                    <Input id="payer_email" name="payer_email" type="email" defaultValue={patientDetails.payer_email ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payer_phone">Proposer/Payer phone number <span className="text-destructive">*</span></Label>
                                    <PhoneInput name="payer_phone" defaultValue={patientDetails.payer_phone ?? ''} required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="tpaName">TPA</Label>
                                    <Input id="tpaName" name="tpaName" defaultValue={patientDetails.tpaName ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="treat_doc_name">Treating doctor’s name <span className="text-destructive">*</span></Label>
                                    <Input id="treat_doc_name" name="treat_doc_name" defaultValue={patientDetails.treat_doc_name ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="treat_doc_number">Treating doctor’s contact <span className="text-destructive">*</span></Label>
                                    <PhoneInput name="treat_doc_number" defaultValue={patientDetails.treat_doc_number ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="treat_doc_qualification">Doctor’s qualification <span className="text-destructive">*</span></Label>
                                    <Input id="treat_doc_qualification" name="treat_doc_qualification" defaultValue={patientDetails.treat_doc_qualification ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="treat_doc_reg_no">Doctor’s registration no. <span className="text-destructive">*</span></Label>
                                    <Input id="treat_doc_reg_no" name="treat_doc_reg_no" defaultValue={patientDetails.treat_doc_reg_no ?? ''} required />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Accordion type="multiple" className="w-full space-y-6">
                            <Card>
                            <AccordionItem value="clinical-info">
                                <CardHeader>
                                    <AccordionTrigger>
                                        <CardTitle>C. Clinical Information</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="natureOfIllness">Nature of illness / presenting complaints</Label>
                                            <Input id="natureOfIllness" name="natureOfIllness" defaultValue={patientDetails.natureOfIllness ?? ''} />
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="clinicalFindings">Relevant clinical findings</Label>
                                            <Input id="clinicalFindings" name="clinicalFindings" defaultValue={patientDetails.clinicalFindings ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ailmentDuration">Duration of present ailment (days)</Label>
                                            <Input id="ailmentDuration" name="ailmentDuration" type="number" defaultValue={patientDetails.ailmentDuration ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="firstConsultationDate">Date of first consultation</Label>
                                            <Input id="firstConsultationDate" name="firstConsultationDate" type="date" defaultValue={formatDateForInput(patientDetails.firstConsultationDate)} />
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="pastHistory">Past history of present ailment</Label>
                                            <Input id="pastHistory" name="pastHistory" defaultValue={patientDetails.pastHistory ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="provisionalDiagnosis">Provisional diagnosis</Label>
                                            <Input id="provisionalDiagnosis" name="provisionalDiagnosis" defaultValue={patientDetails.provisionalDiagnosis ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icd10Codes">ICD-10 diagnosis code(s)</Label>
                                            <Input id="icd10Codes" name="icd10Codes" defaultValue={patientDetails.icd10Codes ?? ''} />
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label>Proposed line of treatment</Label>
                                            <div className="grid md:grid-cols-2 gap-4">
                                               <Input name="treatmentMedical" placeholder="Medical management" defaultValue={patientDetails.treatmentMedical ?? ''} />
                                               <Input name="treatmentSurgical" placeholder="Surgical management" defaultValue={patientDetails.treatmentSurgical ?? ''} />
                                               <Input name="treatmentIntensiveCare" placeholder="Intensive care" defaultValue={patientDetails.treatmentIntensiveCare ?? ''} />
                                               <Input name="treatmentInvestigation" placeholder="Investigation only" defaultValue={patientDetails.treatmentInvestigation ?? ''} />
                                               <Input name="treatmentNonAllopathic" placeholder="Non-allopathic" defaultValue={patientDetails.treatmentNonAllopathic ?? ''} />
                                            </div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="investigationDetails">Investigation / medical management details</Label>
                                            <Input id="investigationDetails" name="investigationDetails" defaultValue={patientDetails.investigationDetails ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="drugRoute">Route of drug administration</Label>
                                            <Input id="drugRoute" name="drugRoute" defaultValue={patientDetails.drugRoute ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="procedureName">Planned procedure / surgery name</Label>
                                            <Input id="procedureName" name="procedureName" defaultValue={patientDetails.procedureName ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icd10PcsCodes">ICD-10-PCS / procedure code(s)</Label>
                                            <Input id="icd10PcsCodes" name="icd10PcsCodes" defaultValue={patientDetails.icd10PcsCodes ?? ''} />
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="otherTreatments">Any other treatments (details)</Label>
                                            <Input id="otherTreatments" name="otherTreatments" defaultValue={patientDetails.otherTreatments ?? ''} />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                            </Card>

                            <Card>
                            <AccordionItem value="accident-info">
                                 <CardHeader>
                                    <AccordionTrigger>
                                        <CardTitle>D. Accident / Medico-Legal</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isInjury" name="isInjury" defaultChecked={patientDetails.isInjury}/>
                                            <Label htmlFor="isInjury">Due to injury/accident?</Label>
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="injuryCause">How did injury occur?</Label>
                                            <Input id="injuryCause" name="injuryCause" defaultValue={patientDetails.injuryCause ?? ''} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isRta" name="isRta" defaultChecked={patientDetails.isRta} />
                                            <Label htmlFor="isRta">Road Traffic Accident?</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="injuryDate">Date of injury</Label>
                                            <Input id="injuryDate" name="injuryDate" type="date" defaultValue={formatDateForInput(patientDetails.injuryDate)} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isReportedToPolice" name="isReportedToPolice" defaultChecked={patientDetails.isReportedToPolice} />
                                            <Label htmlFor="isReportedToPolice">Reported to police?</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="firNumber">FIR number</Label>
                                            <Input id="firNumber" name="firNumber" defaultValue={patientDetails.firNumber ?? ''} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isAlcoholSuspected" name="isAlcoholSuspected" defaultChecked={patientDetails.isAlcoholSuspected} />
                                            <Label htmlFor="isAlcoholSuspected">Alcohol/substance use?</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isToxicologyConducted" name="isToxicologyConducted" defaultChecked={patientDetails.isToxicologyConducted} />
                                            <Label htmlFor="isToxicologyConducted">Toxicology test done?</Label>
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                            </Card>
                            
                            <Card>
                             <AccordionItem value="maternity-info">
                                 <CardHeader>
                                    <AccordionTrigger>
                                        <CardTitle>E. Maternity</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                         <div className="flex items-center space-x-2">
                                            <Checkbox id="isMaternity" name="isMaternity" defaultChecked={patientDetails.isMaternity} />
                                            <Label htmlFor="isMaternity">Is this a maternity case?</Label>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 md:col-span-2">
                                            <Input name="g" type="number" min="0" placeholder="G" defaultValue={patientDetails.g ?? ''} />
                                            <Input name="p" type="number" min="0" placeholder="P" defaultValue={patientDetails.p ?? ''} />
                                            <Input name="l" type="number" min="0" placeholder="L" defaultValue={patientDetails.l ?? ''} />
                                            <Input name="a" type="number" min="0" placeholder="A" defaultValue={patientDetails.a ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="expectedDeliveryDate">Expected date of delivery</Label>
                                            <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" defaultValue={formatDateForInput(patientDetails.expectedDeliveryDate)} />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                             </Card>

                             <Card>
                            <AccordionItem value="cost-info">
                                <CardHeader>
                                    <AccordionTrigger>
                                        <CardTitle>F. Admission & Cost Estimate</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                     <CardContent className="grid md:grid-cols-3 gap-4" onBlurCapture={calculateTotalCost}>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionDate">Admission date</Label>
                                            <Input id="admissionDate" name="admissionDate" type="date" defaultValue={formatDateForInput(patientDetails.admissionDate)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="admissionTime">Admission time</Label>
                                            <Input id="admissionTime" name="admissionTime" type="time" defaultValue={patientDetails.admissionTime ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="admissionType">Type of admission</Label>
                                            <Input id="admissionType" name="admissionType" placeholder="e.g. Emergency, Planned" defaultValue={patientDetails.admissionType ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="expectedStay">Expected days of stay</Label>
                                            <Input id="expectedStay" name="expectedStay" type="number" min="0" defaultValue={patientDetails.expectedStay ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedIcuStay">Expected days in ICU</Label>
                                            <Input id="expectedIcuStay" name="expectedIcuStay" type="number" min="0" defaultValue={patientDetails.expectedIcuStay ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="roomCategory">Requested room category</Label>
                                             <Select name="roomCategory" defaultValue={patientDetails.roomCategory ?? undefined}>
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
                                            <Input id="roomNursingDietCost" name="roomNursingDietCost" type="number" min="0" defaultValue={patientDetails.roomNursingDietCost ?? ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="investigationCost">Diagnostics/investigations cost (₹)</Label>
                                            <Input id="investigationCost" name="investigationCost" type="number" min="0" defaultValue={patientDetails.investigationCost ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="icuCost">ICU charges (₹)</Label>
                                            <Input id="icuCost" name="icuCost" type="number" min="0" defaultValue={patientDetails.icuCost ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="otCost">OT charges (₹)</Label>
                                            <Input id="otCost" name="otCost" type="number" min="0" defaultValue={patientDetails.otCost ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="professionalFees">Professional fees (₹)</Label>
                                            <Input id="professionalFees" name="professionalFees" type="number" min="0" defaultValue={patientDetails.professionalFees ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="medicineCost">Medicines + consumables (₹)</Label>
                                            <Input id="medicineCost" name="medicineCost" type="number" min="0" defaultValue={patientDetails.medicineCost ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="otherHospitalExpenses">Other hospital expenses (₹)</Label>
                                            <Input id="otherHospitalExpenses" name="otherHospitalExpenses" type="number" min="0" defaultValue={patientDetails.otherHospitalExpenses ?? ''} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="packageCharges">All-inclusive package charges (₹)</Label>
                                            <Input id="packageCharges" name="packageCharges" type="number" min="0" defaultValue={patientDetails.packageCharges ?? ''} />
                                        </div>
                                         <div className="space-y-2 md:col-span-3">
                                            <Label htmlFor="totalExpectedCost-display">Total expected cost (₹)</Label>
                                            <Input id="totalExpectedCost-display" name="totalExpectedCost-display" type="number" min="0" value={totalCost} readOnly className="font-bold text-lg" />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                             </Card>
                             
                            <PreAuthMedicalHistory initialData={patientDetails.complaints || []} />
                             
                              <Card>
                             <AccordionItem value="declarations-info">
                                <CardHeader>
                                    <AccordionTrigger>
                                        <CardTitle>H. Declarations &amp; Attachments</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                     <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationName">Patient/insured name</Label>
                                                <Input id="patientDeclarationName" name="patientDeclarationName" defaultValue={patientDetails.patientDeclarationName ?? patientDetails.fullName}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationContact">Contact number</Label>
                                                <PhoneInput name="patientDeclarationContact" defaultValue={patientDetails.patientDeclarationContact ?? patientDetails.phoneNumber ?? ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationEmail">Email ID</Label>
                                                <Input id="patientDeclarationEmail" name="patientDeclarationEmail" type="email" defaultValue={patientDetails.patientDeclarationEmail ?? patientDetails.email_address ?? ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationDate">Declaration date</Label>
                                                <Input id="patientDeclarationDate" name="patientDeclarationDate" type="date" defaultValue={formatDateForInput(patientDetails.patientDeclarationDate)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="patientDeclarationTime">Declaration time</Label>
                                                <Input id="patientDeclarationTime" name="patientDeclarationTime" type="time" defaultValue={patientDetails.patientDeclarationTime ?? ''} />
                                            </div>
                                        </div>
                                         <div className="grid md:grid-cols-3 gap-4 border-t pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="hospitalDeclarationDoctorName">Hospital declaration – doctor name</Label>
                                                <Input id="hospitalDeclarationDoctorName" name="hospitalDeclarationDoctorName" defaultValue={patientDetails.hospitalDeclarationDoctorName ?? patientDetails.treat_doc_name} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hospitalDeclarationDate">Declaration date</Label>
                                                <Input id="hospitalDeclarationDate" name="hospitalDeclarationDate" type="date" defaultValue={formatDateForInput(patientDetails.hospitalDeclarationDate)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hospitalDeclarationTime">Declaration time</Label>
                                                <Input id="hospitalDeclarationTime" name="hospitalDeclarationTime" type="time" defaultValue={patientDetails.hospitalDeclarationTime ?? ''} />
                                            </div>
                                        </div>
                                         <div className="space-y-2 pt-4 border-t">
                                            <Label>Attachments to enclose</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {['Aadhar Card', 'Pan Card', 'Insurance Policy / E Card', 'ICP Paper / OPD Paper', 'Lab Report'].map(item => (
                                                     <div key={item} className="flex items-center space-x-2">
                                                        <Checkbox id={`att-${item}`} name="attachments" value={item} defaultChecked={patientDetails.attachments?.includes(item)} />
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

                        </>
                    )}
                    </div>
                    

                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Request</CardTitle>
                             <CardDescription>Draft the email to the insurance provider.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Request Type</Label>
                                <RadioGroup value={requestType} onValueChange={setRequestType}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="surgical" id="r1" />
                                        <Label htmlFor="r1">Surgical Pre-Authorization Request</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="pre-auth" id="r2" />
                                        <Label htmlFor="r2">Pre-Authorization Request</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to-display">To <span className="text-destructive">*</span></Label>
                                    <Input id="to-display" name="to-display" placeholder="Select a patient to populate TPA email" value={toEmail} required readOnly disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from-display">From</Label>
                                    <Input id="from-display" name="from-display" value={hospitalDetails?.email || user?.email || ''} readOnly disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                                <Input id="subject" name="subject" placeholder="Pre-Authorization Request for..." value={subject} onChange={(e) => setSubject(e.target.value)} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="details">Compose Email <span className="text-destructive">*</span></Label>
                                <Editor
                                  editorState={editorState}
                                  onEditorStateChange={setEditorState}
                                  wrapperClassName="rounded-md border border-input bg-background"
                                  editorClassName="px-4 py-2 min-h-[150px]"
                                  toolbarClassName="border-b border-input"
                                />
                            </div>
                            {patientDetails && (
                                <div className="space-y-2 pt-4 border-t">
                                    <Label>Available Documents to Attach</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {documentFields.map(({ key, label }) => {
                                            const doc = patientDetails[key];
                                            if (doc && typeof doc === 'object' && doc.url) {
                                                return (
                                                    <div key={key} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`attach-${key}`} 
                                                            name="email_attachments" 
                                                            value={JSON.stringify({ name: (doc as any).name, url: (doc as any).url })}
                                                            onCheckedChange={(checked) => {
                                                                const attachmentString = JSON.stringify({ name: (doc as any).name, url: (doc as any).url });
                                                                setSelectedAttachments(prev => 
                                                                    checked 
                                                                    ? [...prev, attachmentString]
                                                                    : prev.filter(item => item !== attachmentString)
                                                                );
                                                            }}
                                                        />
                                                        <Label htmlFor={`attach-${key}`} className="font-normal flex items-center gap-1 cursor-pointer">
                                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                            {label}
                                                        </Label>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                     <div className="flex justify-end gap-4">
                        {(addState.type === 'error' || draftState.type === 'error') && <p className="text-sm text-destructive self-center">{addState.message || draftState.message}</p>}
                        <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                           <Download className="mr-2 h-4 w-4" />
                           Download as PDF
                        </Button>
                        <SubmitButton formAction={addAction} />
                     </div>
                </div>
            </form>
        </div>
    );
}
