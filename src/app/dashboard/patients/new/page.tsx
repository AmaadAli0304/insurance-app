
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddPatient } from "../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompaniesForForm, getTPAsForForm } from "../../company-hospitals/actions";
import type { Company, TPA } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Add Patient Record"}
        </Button>
    );
}

export default function NewPatientPage() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddPatient, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [companies, setCompanies] = useState<Pick<Company, "id" | "name">[]>([]);
    const [tpas, setTpas] = useState<Pick<TPA, "id" | "name">[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        async function loadData() {
            try {
                const [companyList, tpaList] = await Promise.all([
                    getCompaniesForForm(),
                    getTPAsForForm()
                ]);
                setCompanies(companyList);
                setTpas(tpaList);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load required data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [toast]);
    
    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Patient", description: state.message, variant: "success" });
            router.push('/dashboard/patients');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Patient</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="hospital_id" value={user?.hospitalId || ''} />
                <div className="grid gap-6">
                    {/* Patient Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>A. Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Full Name (as per ID proof) <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Registered mobile number <span className="text-destructive">*</span></Label>
                                <Input id="phone" name="phone" required maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="alternative_number">Alternate contact number</Label>
                                <Input id="alternative_number" name="alternative_number" maxLength={10} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                                <Select name="gender" required>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
                                <Input id="age" name="age" type="number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Date of birth <span className="text-destructive">*</span></Label>
                                <Input id="birth_date" name="birth_date" type="date" />
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                                <Input id="address" name="address" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="occupation">Occupation</Label>
                                <Input id="occupation" name="occupation" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="employee_id">Employee ID</Label>
                                <Input id="employee_id" name="employee_id" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="abha_id">ABHA ID</Label>
                                <Input id="abha_id" name="abha_id" />
                            </div>
                              <div className="space-y-2">
                                <Label htmlFor="health_id">Health ID / UHID</Label>
                                <Input id="health_id" name="health_id" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>B. Insurance & Admission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="admission_id">Admission ID <span className="text-destructive">*</span></Label>
                                <Input id="admission_id" name="admission_id" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relationship_policyholder">Relationship to policyholder <span className="text-destructive">*</span></Label>
                                <Input id="relationship_policyholder" name="relationship_policyholder" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policy_number">Policy number <span className="text-destructive">*</span></Label>
                                <Input id="policy_number" name="policy_number" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="insured_card_number">Insured member / card ID number <span className="text-destructive">*</span></Label>
                                <Input id="insured_card_number" name="insured_card_number" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_id">Insurance Company <span className="text-destructive">*</span></Label>
                                <Select name="company_id" required disabled={isLoading}>
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
                                <Input id="policy_start_date" name="policy_start_date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policy_end_date">Policy End Date <span className="text-destructive">*</span></Label>
                                <Input id="policy_end_date" name="policy_end_date" type="date" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="corporate_policy_number">Corporate policy name/number</Label>
                                <Input id="corporate_policy_number" name="corporate_policy_number" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="other_policy_name">Other active health insurance</Label>
                                <Input id="other_policy_name" name="other_policy_name" placeholder="Name of other insurer" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="family_doctor_name">Family physician name</Label>
                                <Input id="family_doctor_name" name="family_doctor_name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="family_doctor_phone">Family physician contact</Label>
                                <Input id="family_doctor_phone" name="family_doctor_phone" maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="payer_email">Proposer/Payer email ID <span className="text-destructive">*</span></Label>
                                <Input id="payer_email" name="payer_email" type="email" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="payer_phone">Proposer/Payer phone number <span className="text-destructive">*</span></Label>
                                <Input id="payer_phone" name="payer_phone" required maxLength={10} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hospital & TPA Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>C. Hospital & TPA Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tpa_id">Select TPA <span className="text-destructive">*</span></Label>
                                <Select name="tpa_id" disabled={isLoading} required>
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
                                <Input id="treat_doc_name" name="treat_doc_name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="treat_doc_number">Treating doctor’s contact <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_number" name="treat_doc_number" required maxLength={10} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="treat_doc_qualification">Doctor’s qualification <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_qualification" name="treat_doc_qualification" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="treat_doc_reg_no">Doctor’s registration no. <span className="text-destructive">*</span></Label>
                                <Input id="treat_doc_reg_no" name="treat_doc_reg_no" required />
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
