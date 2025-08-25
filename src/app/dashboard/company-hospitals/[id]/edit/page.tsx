
"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateHospital, getStaff, getCompaniesForForm, getTPAsForForm, getHospitalById } from "../../actions";
import Link from "next/link";
import { ArrowLeft, ChevronsUpDown, X } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
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

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditCompanyHospitalPage({ params }: { params: { id: string } }) {
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

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const [hospitalData, staffList, companiesList, tpasList] = await Promise.all([
                    getHospitalById(params.id),
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

            } catch (error) {
                console.error("Failed to fetch data for hospital form", error);
                toast({ title: "Error", description: "Failed to load required data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [params.id, toast]);


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
                                <Input id="phone" name="phone" defaultValue={hospital.phone ?? ""} />
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
