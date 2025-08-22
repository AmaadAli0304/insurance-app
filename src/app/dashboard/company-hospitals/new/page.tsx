
"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddHospital, getStaff, getCompaniesForForm, getTPAsForForm } from "../actions";
import Link from "next/link";
import { ArrowLeft, ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Staff, Company, TPA } from "@/lib/types";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Hospital"}
        </Button>
    );
}

export default function NewCompanyHospitalPage() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddHospital, { message: "" });
    
    const [companies, setCompanies] = useState<Pick<Company, 'id' | 'name'>[]>([]);
    const [tpas, setTpas] = useState<Pick<TPA, 'id' | 'name'>[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);

    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([user?.companyId || '']);
    const [selectedTPAs, setSelectedTPAs] = useState<string[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [staffList, companiesList, tpasList] = await Promise.all([
                    getStaff(),
                    getCompaniesForForm(),
                    getTPAsForForm()
                ]);
                setStaff(staffList);
                setCompanies(companiesList);
                setTpas(tpasList);
            } catch (error) {
                console.error("Failed to fetch data for hospital form", error);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/company-hospitals">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Add New Hospital</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Hospital Details</CardTitle>
                    <CardDescription>Fill in the form to add a new hospital to your network.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <input type="hidden" name="companyId" value={user?.companyId || ''} />
                    <CardContent className="space-y-4">
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Hospital Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" placeholder="e.g. Mercy General Hospital" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                                <Input id="location" name="location" placeholder="e.g. Sacramento" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address <span className="text-destructive">*</span></Label>
                            <Textarea id="address" name="address" placeholder="e.g. 4001 J St, Sacramento, CA" required />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" placeholder="e.g. TPA Desk Incharge" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. contact@hospital.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" placeholder="e.g. 916-453-4444" />
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
                                    <DropdownMenuContent className="w-full">
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
                                        <Badge key={id} variant="secondary">{companies.find(c=>c.id === id)?.name}</Badge>
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
                                    <DropdownMenuContent className="w-full">
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
                                        <Badge key={id} variant="secondary">{tpas.find(t=>String(t.id) === id)?.name}</Badge>
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
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    {staff.map(s => (
                                        <DropdownMenuCheckboxItem
                                            key={s.id}
                                            checked={selectedStaff.includes(String(s.id))}
                                            onCheckedChange={(checked) => {
                                                const staffId = String(s.id);
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
                                    <Badge key={id} variant="secondary">{staff.find(s => String(s.id) === id)?.name}</Badge>
                                ))}
                            </div>
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
