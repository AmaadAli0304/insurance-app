

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormStatus } from "react-dom";
import { handleCreateTable, handleCreateRelationshipTables, handleCreateHospitalTable, handleCreatePatientsTable, handleCreateFieldsTable, handleCreateFieldOptionsTable, handleCreateAdmissionsTable, handleCreateIctCodeTable, handleCreateDoctorsTable, handleCreateChiefComplaintsTable, handleCreatePreAuthTable, handleCreateMedicalTable, handleCreateChatTable, handleAlterPreAuthTable, handleCreateClaimsTable } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, GitMerge, UserPlus, Building, Users, FilePlus2, ListPlus, BedDouble, Info, Stethoscope, FileHeart, Shield, MessageSquare, Pill, AlertTriangle, HandCoins } from "lucide-react";
import { useAuth } from "@/components/auth-provider";


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

function SubmitDoctorsTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <Stethoscope className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Doctors Table"}
        </Button>
    );
}

function SubmitChiefComplaintsTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <FileHeart className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Chief Complaints Table"}
        </Button>
    );
}

function SubmitPreAuthTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <Shield className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Pre-Auth Request Table"}
        </Button>
    );
}

function SubmitAlterPreAuthTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="destructive">
             <AlertTriangle className="mr-2 h-4 w-4" />
            {pending ? "Altering..." : "Alter Pre-Auth Table"}
        </Button>
    );
}

function SubmitMedicalTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <Pill className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Medical Table"}
        </Button>
    );
}

function SubmitChatTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <MessageSquare className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Chat Table"}
        </Button>
    );
}

function SubmitClaimsTableButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="secondary">
             <HandCoins className="mr-2 h-4 w-4" />
            {pending ? "Creating..." : "Create Claims Table"}
        </Button>
    );
}


export default function ImportPage() {
    const { role } = useAuth();
    const [createTableState, createTableAction] = useActionState(handleCreateTable, { message: "", type: undefined });
    const [createRelationshipTableState, createRelationshipTableAction] = useActionState(handleCreateRelationshipTables, { message: "", type: undefined });
    const [createHospitalTableState, createHospitalTableAction] = useActionState(handleCreateHospitalTable, { message: "", type: undefined });
    const [createPatientsTableState, createPatientsTableAction] = useActionState(handleCreatePatientsTable, { message: "", type: undefined });
    const [createFieldsTableState, createFieldsTableAction] = useActionState(handleCreateFieldsTable, { message: "", type: undefined });
    const [createFieldOptionsTableState, createFieldOptionsTableAction] = useActionState(handleCreateFieldOptionsTable, { message: "", type: undefined });
    const [createAdmissionsTableState, createAdmissionsTableAction] = useActionState(handleCreateAdmissionsTable, { message: "", type: undefined });
    const [createIctCodeTableState, createIctCodeTableAction] = useActionState(handleCreateIctCodeTable, { message: "", type: undefined });
    const [createDoctorsTableState, createDoctorsTableAction] = useActionState(handleCreateDoctorsTable, { message: "", type: undefined });
    const [createChiefComplaintsTableState, createChiefComplaintsTableAction] = useActionState(handleCreateChiefComplaintsTable, { message: "", type: undefined });
    const [createPreAuthTableState, createPreAuthTableAction] = useActionState(handleCreatePreAuthTable, { message: "", type: undefined });
    const [alterPreAuthTableState, alterPreAuthTableAction] = useActionState(handleAlterPreAuthTable, { message: "", type: undefined });
    const [createMedicalTableState, createMedicalTableAction] = useActionState(handleCreateMedicalTable, { message: "", type: undefined });
    const [createChatTableState, createChatTableAction] = useActionState(handleCreateChatTable, { message: "", type: undefined });
    const [createClaimsTableState, createClaimsTableAction] = useActionState(handleCreateClaimsTable, { message: "", type: undefined });



    const { toast } = useToast();

    const useToastEffect = (state: { type?: string; message: string; }, title: string) => {
        useEffect(() => {
            if (state.type === 'success') {
                toast({ title, description: state.message, variant: "success" });
            } else if (state.type === 'error') {
                toast({ title: "Error", description: state.message, variant: "destructive" });
            }
        }, [state, toast, title]);
    };

    useToastEffect(createTableState, "Database Action");
    useToastEffect(createRelationshipTableState, "Database Action");
    useToastEffect(createHospitalTableState, "Database Action");
    useToastEffect(createPatientsTableState, "Database Action");
    useToastEffect(createFieldsTableState, "Database Action");
    useToastEffect(createFieldOptionsTableState, "Database Action");
    useToastEffect(createAdmissionsTableState, "Database Action");
    useToastEffect(createIctCodeTableState, "Database Action");
    useToastEffect(createDoctorsTableState, "Database Action");
    useToastEffect(createChiefComplaintsTableState, "Database Action");
    useToastEffect(createPreAuthTableState, "Database Action");
    useToastEffect(alterPreAuthTableState, "Database Action");
    useToastEffect(createMedicalTableState, "Database Action");
    useToastEffect(createChatTableState, "Database Action");
    useToastEffect(createClaimsTableState, "Database Action");

    

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Database Management</CardTitle>
                    <CardDescription>
                       Perform database setup tasks. Use these to create necessary tables if they don't exist.
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
                    <form action={createDoctorsTableAction}>
                        <SubmitDoctorsTableButton />
                    </form>
                    <form action={createChiefComplaintsTableAction}>
                        <SubmitChiefComplaintsTableButton />
                    </form>
                     <form action={createPreAuthTableAction}>
                        <SubmitPreAuthTableButton />
                    </form>
                     <form action={createMedicalTableAction}>
                        <SubmitMedicalTableButton />
                    </form>
                     <form action={createChatTableAction}>
                        <SubmitChatTableButton />
                    </form>
                     <form action={createClaimsTableAction}>
                        <SubmitClaimsTableButton />
                    </form>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Database Maintenance</CardTitle>
                    <CardDescription>
                       Use these actions to modify existing tables.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="flex flex-wrap gap-4">
                    <form action={alterPreAuthTableAction}>
                        <SubmitAlterPreAuthTableButton />
                    </form>
                 </CardContent>
            </Card>
        </div>
    );
}
