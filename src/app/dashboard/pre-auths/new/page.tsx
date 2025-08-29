
"use client";

import { useState, useActionState, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleAddRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, Send, Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { getPatientWithDetailsForForm, getPatientsForPreAuth } from "@/app/dashboard/patients/actions";
import type { Patient } from "@/lib/types";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Send className="mr-2 h-4 w-4" />
            {pending ? "Submitting..." : "Send Request"}
        </Button>
    );
}

export default function NewRequestPage() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddRequest, { message: "" });
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);
    const [hospitalPatients, setHospitalPatients] = useState<{ id: string; fullName: string; admission_id: string; }[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchListOpen, setIsSearchListOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
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
    }, [state, toast, router]);

    useEffect(() => {
        if (!user?.hospitalId) return;

        async function loadInitialData() {
            try {
                const patients = await getPatientsForPreAuth(user!.hospitalId!);
                setHospitalPatients(patients);

                const patientIdFromUrl = searchParams.get('patientId');
                if (patientIdFromUrl) {
                    const preselectedPatient = patients.find(p => String(p.id) === patientIdFromUrl);
                    if (preselectedPatient) {
                        setSelectedPatientId(preselectedPatient.id);
                        setSearchQuery(`${preselectedPatient.fullName} - ${preselectedPatient.admission_id}`);
                    }
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch hospital patients.", variant: 'destructive' });
            }
        }
        
        loadInitialData();

    }, [user?.hospitalId, searchParams, toast]);


    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedPatientId) {
                setPatientDetails(null);
                return;
            }
            setIsLoadingPatient(true);
            try {
                const details = await getPatientWithDetailsForForm(selectedPatientId);
                setPatientDetails(details);
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
            <form action={formAction}>
                 <input type="hidden" name="patientId" value={selectedPatientId || ''} />
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                 <input type="hidden" name="from" value={user?.email || ''} />
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
                    
                    {patientDetails && (
                        <>
                        <Card>
                            <CardHeader>
                                <CardTitle>A. Patient Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name (as per ID proof) <span className="text-destructive">*</span></Label>
                                    <Input id="name" name="name" defaultValue={patientDetails.fullName} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email_address">Email Address <span className="text-destructive">*</span></Label>
                                    <Input id="email_address" name="email_address" type="email" defaultValue={patientDetails.email_address ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Registered mobile number <span className="text-destructive">*</span></Label>
                                    <Input id="phone_number" name="phone_number" defaultValue={patientDetails.phoneNumber ?? ''} required maxLength={10} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="alternative_number">Alternate contact number</Label>
                                    <Input id="alternative_number" name="alternative_number" defaultValue={patientDetails.alternative_number ?? ''} maxLength={10} />
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
                                    <Input id="birth_date" name="birth_date" type="date" defaultValue={formatDateForInput(patientDetails.dateOfBirth)} />
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
                                    <Label htmlFor="health_id">Health ID / UHID</Label>
                                    <Input id="health_id" name="health_id" defaultValue={patientDetails.health_id ?? ''} />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>C. Insurance &amp; Admission Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admission_id">Admission ID <span className="text-destructive">*</span></Label>
                                    <Input id="admission_id" name="admission_id" defaultValue={patientDetails.admission_id ?? ''} required />
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
                                    <Label htmlFor="companyName">Insurance Company</Label>
                                    <Input id="companyName" name="companyName" defaultValue={patientDetails.companyName ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_start_date">Policy Start Date <span className="text-destructive">*</span></Label>
                                    <Input id="policy_start_date" name="policy_start_date" type="date" defaultValue={formatDateForInput(patientDetails.policyStartDate)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_end_date">Policy End Date <span className="text-destructive">*</span></Label>
                                    <Input id="policy_end_date" name="policy_end_date" type="date" defaultValue={formatDateForInput(patientDetails.policyEndDate)} required />
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
                                    <Input id="family_doctor_phone" name="family_doctor_phone" defaultValue={patientDetails.family_doctor_phone ?? ''} maxLength={10} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payer_email">Proposer/Payer email ID <span className="text-destructive">*</span></Label>
                                    <Input id="payer_email" name="payer_email" type="email" defaultValue={patientDetails.payer_email ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payer_phone">Proposer/Payer phone number <span className="text-destructive">*</span></Label>
                                    <Input id="payer_phone" name="payer_phone" defaultValue={patientDetails.payer_phone ?? ''} required maxLength={10} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>D. Hospital &amp; TPA Details</CardTitle></CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
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
                                    <Input id="treat_doc_number" name="treat_doc_number" defaultValue={patientDetails.treat_doc_number ?? ''} required maxLength={10} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="treat_doc_qualification">Doctor’s qualification <span className="text-destructive">*</span></Label>
                                    <Input id="treat_doc_qualification" name="treat_doc_qualification" defaultValue={patientDetails.treat_doc_qualification ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="treat_doc_reg_no">Doctor’s registration no. <span className="text-destructive">*</span></Label>
                                    <Input id="treat_doc_reg_no" name="treat_doc_reg_no" defaultValue={patientDetails.treat_doc_reg_no ?? ''} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                                    <Input id="estimatedCost" name="estimatedCost" type="number" defaultValue={patientDetails.estimatedCost ?? ''} />
                                </div>
                            </CardContent>
                        </Card>
                        </>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Request</CardTitle>
                             <CardDescription>Draft the email to the insurance provider.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to">To <span className="text-destructive">*</span></Label>
                                    <Input id="to" name="to" placeholder="e.g. claims@company.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from">From</Label>
                                    <Input id="from-display" name="from-display" value={user?.email} readOnly disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                                <Input id="subject" name="subject" placeholder="Pre-Authorization Request for..." required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="details">Compose Email <span className="text-destructive">*</span></Label>
                                <Textarea id="details" name="details" placeholder="Please approve treatment for..." required rows={10}/>
                            </div>
                        </CardContent>
                    </Card>

                     <div className="flex justify-end gap-4">
                        {state.type === 'error' && <p className="text-sm text-destructive self-center">{state.message}</p>}
                        <Button type="button" variant="outline">
                           <Download className="mr-2 h-4 w-4" />
                           Download as PDF
                        </Button>
                        <SubmitButton />
                     </div>
                </div>
            </form>
        </div>
    );
}
