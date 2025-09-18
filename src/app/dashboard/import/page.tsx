
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormStatus } from "react-dom";
import { handleCreateTable, handleCreateRelationshipTables, handleCreateHospitalTable, handleCreatePatientsTable, handleCreateFieldsTable, handleCreateFieldOptionsTable, handleCreateAdmissionsTable, handleCreateIctCodeTable, handleCreateDoctorsTable, handleCreateChiefComplaintsTable, handleCreatePreAuthTable, handleCreateMedicalTable, handleCreateChatTable, handleAlterPreAuthTable, handleCreateClaimsTable, handleDeleteClaimsTable, handleDeletePreAuthRequestTable, handleUpdatePatientsTable, handleSendEmail, handleCreateChatFilesTable, handleCreateInvoicesTable, handleCreateInvoiceStaffTable, handleCreateAttendanceTable, handleCreateStaffSalaryTable } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, GitMerge, UserPlus, Building, Users, FilePlus2, ListPlus, BedDouble, Info, Stethoscope, FileHeart, Shield, MessageSquare, Pill, AlertTriangle, HandCoins, Trash2, RefreshCcw, Send, FileCode, FileSpreadsheet, CalendarCheck, Wallet } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


function SubmitTableButton({ action, children, icon: Icon }: { action: any, children: React.ReactNode, icon: React.ElementType }) {
    const { pending } = useFormStatus();
    return (
        <form action={action}>
            <Button type="submit" disabled={pending} variant="secondary">
                <Icon className="mr-2 h-4 w-4" />
                {pending ? "Processing..." : children}
            </Button>
        </form>
    );
}

function SubmitActionButton({ action, children, icon: Icon, variant = 'secondary' }: { action: any, children: React.ReactNode, icon: React.ElementType, variant?: 'secondary' | 'destructive' }) {
    const { pending } = useFormStatus();
    return (
        <form action={action}>
            <Button type="submit" disabled={pending} variant={variant}>
                <Icon className="mr-2 h-4 w-4" />
                {pending ? "Processing..." : children}
            </Button>
        </form>
    );
}


function SubmitEmailButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
             <Send className="mr-2 h-4 w-4" />
            {pending ? "Sending..." : "Send Email"}
        </Button>
    );
}


export default function ImportPage() {
    const { user, role } = useAuth();
    const { toast } = useToast();

    const [createTableState, createTableAction] = useActionState(handleCreateTable, { message: "", type: undefined });
    const [createRelationshipTableState, createRelationshipTableAction] = useActionState(handleCreateRelationshipTables, { message: "", type: undefined });
    const [createHospitalTableState, createHospitalTableAction] = useActionState(handleCreateHospitalTable, { message: "", type: undefined });
    const [createPatientsTableState, createPatientsTableAction] = useActionState(handleCreatePatientsTable, { message: "", type: undefined });
    const [updatePatientsTableState, updatePatientsTableAction] = useActionState(handleUpdatePatientsTable, { message: "", type: undefined });
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
    const [createChatFilesTableState, createChatFilesTableAction] = useActionState(handleCreateChatFilesTable, { message: "", type: undefined });
    const [createClaimsTableState, createClaimsTableAction] = useActionState(handleCreateClaimsTable, { message: "", type: undefined });
    const [deleteClaimsTableState, deleteClaimsTableAction] = useActionState(handleDeleteClaimsTable, { message: "", type: undefined });
    const [deletePreAuthTableState, deletePreAuthTableAction] = useActionState(handleDeletePreAuthRequestTable, { message: "", type: undefined });
    const [sendEmailState, sendEmailAction] = useActionState(handleSendEmail, { message: "", type: undefined });
    const [createInvoicesTableState, createInvoicesTableAction] = useActionState(handleCreateInvoicesTable, { message: "", type: undefined });
    const [createInvoiceStaffTableState, createInvoiceStaffTableAction] = useActionState(handleCreateInvoiceStaffTable, { message: "", type: undefined });
    const [createAttendanceTableState, createAttendanceTableAction] = useActionState(handleCreateAttendanceTable, { message: "", type: undefined });
    const [createStaffSalaryTableState, createStaffSalaryTableAction] = useActionState(handleCreateStaffSalaryTable, { message: "", type: undefined });
    
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
    useToastEffect(updatePatientsTableState, "Database Action");
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
    useToastEffect(createChatFilesTableState, "Database Action");
    useToastEffect(createClaimsTableState, "Database Action");
    useToastEffect(deleteClaimsTableState, "Database Action");
    useToastEffect(deletePreAuthTableState, "Database Action");
    useToastEffect(sendEmailState, "Email Service");
    useToastEffect(createInvoicesTableState, "Database Action");
    useToastEffect(createInvoiceStaffTableState, "Database Action");
    useToastEffect(createAttendanceTableState, "Database Action");
    useToastEffect(createStaffSalaryTableState, "Database Action");
    

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
                    <SubmitActionButton action={createTableAction} icon={Database}>Create TPA Table</SubmitActionButton>
                    <SubmitActionButton action={createRelationshipTableAction} icon={GitMerge}>Create Relationship Tables</SubmitActionButton>
                    <SubmitActionButton action={createHospitalTableAction} icon={Building}>Create Hospital Table</SubmitActionButton>
                    <SubmitActionButton action={createPatientsTableAction} icon={Users}>Create Patient &amp; Admission Tables</SubmitActionButton>
                    <SubmitActionButton action={createFieldsTableAction} icon={FilePlus2}>Create Fields Table</SubmitActionButton>
                    <SubmitActionButton action={createFieldOptionsTableAction} icon={ListPlus}>Create Field Options Table</SubmitActionButton>
                    <SubmitActionButton action={createAdmissionsTableAction} icon={BedDouble}>Create Admissions Table</SubmitActionButton>
                    <SubmitActionButton action={createIctCodeTableAction} icon={FilePlus2}>Create ICT Code Table</SubmitActionButton>
                    <SubmitActionButton action={createDoctorsTableAction} icon={Stethoscope}>Create Doctors Table</SubmitActionButton>
                    <SubmitActionButton action={createChiefComplaintsTableAction} icon={FileHeart}>Create Chief Complaints Table</SubmitActionButton>
                    <SubmitActionButton action={createPreAuthTableAction} icon={Shield}>Create Pre-Auth Request Table</SubmitActionButton>
                    <SubmitActionButton action={createMedicalTableAction} icon={Pill}>Create Medical Table</SubmitActionButton>
                    <SubmitActionButton action={createChatTableAction} icon={MessageSquare}>Create Chat Table</SubmitActionButton>
                    <SubmitActionButton action={createChatFilesTableAction} icon={FileCode}>Create Chat Files Table</SubmitActionButton>
                    <SubmitActionButton action={createClaimsTableAction} icon={HandCoins}>Create Claims Table</SubmitActionButton>
                    <SubmitActionButton action={createInvoicesTableAction} icon={FileSpreadsheet}>Create Invoices Table</SubmitActionButton>
                    <SubmitActionButton action={createInvoiceStaffTableAction} icon={FileSpreadsheet}>Create Invoice Staff Table</SubmitActionButton>
                    <SubmitActionButton action={createAttendanceTableAction} icon={CalendarCheck}>Create Attendance Table</SubmitActionButton>
                    <SubmitActionButton action={createStaffSalaryTableAction} icon={Wallet}>Create Staff Salary Table</SubmitActionButton>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Database Maintenance</CardTitle>
                    <CardDescription>
                       Use these actions to modify or delete existing tables.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="flex flex-wrap gap-4">
                    <SubmitActionButton action={alterPreAuthTableAction} icon={AlertTriangle} variant="destructive">Alter Pre-Auth Table</SubmitActionButton>
                    <SubmitActionButton action={updatePatientsTableAction} icon={RefreshCcw}>Update Patients Table</SubmitActionButton>
                    <SubmitActionButton action={deleteClaimsTableAction} icon={Trash2} variant="destructive">Delete Claims Table</SubmitActionButton>
                    <SubmitActionButton action={deletePreAuthTableAction} icon={Trash2} variant="destructive">Delete Pre-Auth Table</SubmitActionButton>
                 </CardContent>
            </Card>

            {role === 'Company Admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Send Email</CardTitle>
                        <CardDescription>Compose and send an email notification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={sendEmailAction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from">From</Label>
                                    <Input id="from" name="from" type="email" value={user?.email ?? ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="to">To</Label>
                                    <Input id="to" name="to" type="email" placeholder="recipient@example.com" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" name="subject" placeholder="Email subject" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="body">Message</Label>
                                <Textarea id="body" name="body" placeholder="Type your message here." rows={6} required />
                            </div>
                            {sendEmailState.type === 'error' && <p className="text-sm text-destructive">{sendEmailState.message}</p>}
                            <SubmitEmailButton />
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
