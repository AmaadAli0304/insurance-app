
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleImportCompanies, handleCreateTable, handleCreateRelationshipTables, handleCreateHospitalTable, handleCreatePatientsTable, handleCreateFieldsTable } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, GitMerge, UserPlus, Building, Users, FilePlus2 } from "lucide-react";

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
            {pending ? "Creating..." : "Create Patients Table"}
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


export default function ImportPage() {
    const [importState, importAction] = useActionState(handleImportCompanies, { message: "", type: undefined });
    const [createTableState, createTableAction] = useActionState(handleCreateTable, { message: "", type: undefined });
    const [createRelationshipTableState, createRelationshipTableAction] = useActionState(handleCreateRelationshipTables, { message: "", type: undefined });
    const [createHospitalTableState, createHospitalTableAction] = useActionState(handleCreateHospitalTable, { message: "", type: undefined });
    const [createPatientsTableState, createPatientsTableAction] = useActionState(handleCreatePatientsTable, { message: "", type: undefined });
    const [createFieldsTableState, createFieldsTableAction] = useActionState(handleCreateFieldsTable, { message: "", type: undefined });


    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (importState.type === 'success') {
            toast({
                title: "Import Successful",
                description: importState.message,
                variant: "success",
            });
            formRef.current?.reset();
        } else if (importState.type === 'error') {
            toast({
                title: "Import Error",
                description: importState.message,
                variant: "destructive"
            });
        }
    }, [importState, toast]);

     useEffect(() => {
        if (createTableState.type === 'success') {
            toast({
                title: "Database Action",
                description: createTableState.message,
                variant: "success",
            });
        } else if (createTableState.type === 'error') {
            toast({
                title: "Database Error",
                description: createTableState.message,
                variant: "destructive"
            });
        }
    }, [createTableState, toast]);
    
     useEffect(() => {
        if (createRelationshipTableState.type === 'success') {
            toast({
                title: "Database Action",
                description: createRelationshipTableState.message,
                variant: "success",
            });
        } else if (createRelationshipTableState.type === 'error') {
            toast({
                title: "Database Error",
                description: createRelationshipTableState.message,
                variant: "destructive"
            });
        }
    }, [createRelationshipTableState, toast]);

    useEffect(() => {
        if (createHospitalTableState.type === 'success') {
            toast({
                title: "Database Action",
                description: createHospitalTableState.message,
                variant: "success",
            });
        } else if (createHospitalTableState.type === 'error') {
            toast({
                title: "Database Error",
                description: createHospitalTableState.message,
                variant: "destructive"
            });
        }
    }, [createHospitalTableState, toast]);

     useEffect(() => {
        if (createPatientsTableState.type === 'success') {
            toast({
                title: "Database Action",
                description: createPatientsTableState.message,
                variant: "success",
            });
        } else if (createPatientsTableState.type === 'error') {
            toast({
                title: "Database Error",
                description: createPatientsTableState.message,
                variant: "destructive"
            });
        }
    }, [createPatientsTableState, toast]);

    useEffect(() => {
        if (createFieldsTableState.type === 'success') {
            toast({
                title: "Database Action",
                description: createFieldsTableState.message,
                variant: "success",
            });
        } else if (createFieldsTableState.type === 'error') {
            toast({
                title: "Database Error",
                description: createFieldsTableState.message,
                variant: "destructive"
            });
        }
    }, [createFieldsTableState, toast]);


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
                <form action={importAction} ref={formRef}>
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
                </CardContent>
            </Card>
        </div>
    );
}
