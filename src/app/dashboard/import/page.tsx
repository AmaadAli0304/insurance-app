
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleImportCompanies, handleCreateTable, handleCreateRelationshipTables, handleCreateHospitalTable, handleCreatePatientsTable, handleCreateFieldsTable, handleCreateFieldOptionsTable, handleCreateAdmissionsTable, handleCreateIctCodeTable } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, GitMerge, UserPlus, Building, Users, FilePlus2, ListPlus, BedDouble } from "lucide-react";
import { useAuth } from "@/components/auth-provider";


function SubmitImportButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Upload className="mr-2 h-4 w-4" />
            {pending ? "Importing..." : "Import Companies"}
        </Button>
    );
}

function SubmitTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <Database className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create TPA Table"}
        </Button>
    );
}

function SubmitRelationshipTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <GitMerge className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Relationship Tables"}
        </Button>
    );
}

function SubmitHospitalTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <Building className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Hospital Table"}
        </Button>
    );
}

function SubmitPatientTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <Users className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Patient & Admission Tables"}
        </Button>
    );
}

function SubmitFieldsTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <FilePlus2 className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Fields Table"}
        </Button>
    );
}

function SubmitFieldOptionsTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <ListPlus className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Field Options Table"}
        </Button>
    );
}

function SubmitAdmissionsTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <BedDouble className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Admissions Table"}
        </Button>
    );
}

function SubmitIctCodeTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <FilePlus2 className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create ICT Code Table"}
        </Button>
    );
}


export default function ImportPage() {
    const { role } = useAuth();
    const [importState, importAction] = useActionState(handleImportCompanies, { message: "", type: undefined });
    const [createTableState, createTableAction] = useActionState(handleCreateTable, { message: "", type: undefined });
    const [createRelationshipTableState, createRelationshipTableAction] = useActionState(handleCreateRelationshipTables, { message: "", type: undefined });
    const [createHospitalTableState, createHospitalTableAction] = useActionState(handleCreateHospitalTable, { message: "", type: undefined });
    const [createPatientsTableState, createPatientsTableAction] = useActionState(handleCreatePatientsTable, { message: "", type: undefined });
    const [createFieldsTableState, createFieldsTableAction] = useActionState(handleCreateFieldsTable, { message: "", type: undefined });
    const [createFieldOptionsTableState, createFieldOptionsTableAction] = useActionState(handleCreateFieldOptionsTable, { message: "", type: undefined });
    const [createAdmissionsTableState, createAdmissionsTableAction] = useActionState(handleCreateAdmissionsTable, { message: "", type: undefined });
    const [createIctCodeTableState, createIctCodeTableAction] = useActionState(handleCreateIctCodeTable, { message: "", type: undefined });


    const { toast } = useToast();
    const importFormRef = useRef<HTMLFormElement>(null);

    const useToastEffect = (state: { type?: string; message: string; }, title: string) => {
        useEffect(() => {
            if (state.type === 'success') {
                toast({ title, description: state.message, variant: "success" });
            } else if (state.type === 'error') {
                toast({ title: "Error", description: state.message, variant: "destructive" });
            }
        }, [state, toast, title]);
    };

    useToastEffect(importState, "Import Companies");
    useToastEffect(createTableState, "Database Action");
    useToastEffect(createRelationshipTableState, "Database Action");
    useToastEffect(createHospitalTableState, "Database Action");
    useToastEffect(createPatientsTableState, "Database Action");
    useToastEffect(createFieldsTableState, "Database Action");
    useToastEffect(createFieldOptionsTableState, "Database Action");
    useToastEffect(createAdmissionsTableState, "Database Action");
    useToastEffect(createIctCodeTableState, "Database Action");
    

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Import Insurance Companies</CardTitle>
                    <CardDescription>
                        Upload an XLSX file with company data. Ensure the file has columns
                        for &quot;Name&quot; and &quot;Email&quot;.
                    </CardDescription>
                </CardHeader>
                <form action={importAction} ref={importFormRef}>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="file">XLSX File</Label>
                             <div className="flex items-center gap-2">
                                <Input id="file" name="file" type="file" required accept=".xlsx" className="w-full md:w-auto" />
                            </div>
                        </div>

                        {importState.type === 'error' && <p className="text-sm text-destructive">{importState.message}</p>}
                        <SubmitImportButton />
                    </CardContent>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Database Management</CardTitle>
                    <CardDescription>
                       Perform database setup tasks. Use this to create necessary tables if they don't exist.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <form action={createTableAction}>
                        <SubmitTableButton />
                    </form>
                    <form action={createRelationshipTableAction}>
                        <SubmitRelationshipTableButton />
                    </form>
                     <form action={createHospitalTableAction}>
                        <SubmitHospitalTableButton />
                    </form>
                     <form action={createPatientsTableAction}>
                        <SubmitPatientTableButton />
                    </form>
                    <form action={createFieldsTableAction}>
                        <SubmitFieldsTableButton />
                    </form>
                     <form action={createFieldOptionsTableAction}>
                        <SubmitFieldOptionsTableButton />
                    </form>
                    <form action={createAdmissionsTableAction}>
                        <SubmitAdmissionsTableButton />
                    </form>
                    <form action={createIctCodeTableAction}>
                        <SubmitIctCodeTableButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
