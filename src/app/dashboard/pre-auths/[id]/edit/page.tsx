
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateRequest, getPreAuthRequestById } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Loader2, File as FileIcon } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { StaffingRequest, PreAuthStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Checkbox } from "@/components/ui/checkbox";


const Editor = dynamic(
  () => import('react-draft-wysiwyg').then(mod => mod.Editor),
  { ssr: false }
);


function SubmitButton({ onClick }: { onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} onClick={onClick}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                "Update Status"
            )}
        </Button>
    );
}

const preAuthStatuses: PreAuthStatus[] = [
    'Query Raised', 
    'Query Answered', 
    'Enhancement Request', 
    'Enhanced Amount', 
    'Final Discharge sent', 
    'Final Amount Sanctioned', 
    'Amount received',
    'Rejected'
];

const statusesThatRequireEmail: PreAuthStatus[] = [
    'Query Answered', 
    'Enhancement Request', 
    'Final Discharge sent'
];

export default function EditPreAuthPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const id = params.id as string;
    
    const [request, setRequest] = useState<StaffingRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [state, formAction] = useActionState(handleUpdateRequest, { message: "", type: 'initial' });
    const [selectedStatus, setSelectedStatus] = useState<PreAuthStatus | null>(null);
    const [showEmailFields, setShowEmailFields] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);

    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [emailBody, setEmailBody] = useState("");
    const [subject, setSubject] = useState("");


    useEffect(() => {
        setEmailBody(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    }, [editorState]);

    
    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getPreAuthRequestById(id)
            .then(data => {
                if (!data) {
                    notFound();
                } else {
                    setRequest(data);
                    setSelectedStatus(data.status);
                    setShowEmailFields(statusesThatRequireEmail.includes(data.status));
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);

    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Success", description: state.message, variant: "success" });
            router.push(`/dashboard/pre-auths`);
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router, id]);
    
     useEffect(() => {
        if (selectedStatus && request) {
            setShowEmailFields(statusesThatRequireEmail.includes(selectedStatus));
            const claimNo = request.claim_id || request.admission_id || '[______]';
            const hospitalName = request.hospitalName || '[Hospital Name]';
            
            let newSubject = `Update on Pre-Auth – Claim No. ${claimNo} | ${hospitalName}`;
            if (selectedStatus === 'Query Answered') {
                newSubject = `Re: Query for Claim No. ${claimNo} | ${hospitalName}`;
            } else if (selectedStatus === 'Enhancement Request') {
                newSubject = `Enhancement Request – Claim No. ${claimNo} | ${hospitalName}`;
            } else if (selectedStatus === 'Final Discharge sent') {
                 newSubject = `Final Bill & Discharge Summary – Claim No. ${claimNo} | ${hospitalName}`;
            }
            setSubject(newSubject);
        }
    }, [selectedStatus, request]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!request) {
        notFound();
    }

    const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!selectedStatus) {
            event.preventDefault();
            toast({
                title: "Validation Error",
                description: "Please select a status before updating.",
                variant: "destructive",
            });
        }
    };
    
    const documentFields: Array<{ key: keyof StaffingRequest, label: string }> = [
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
                    <Link href={`/dashboard/pre-auths`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Update Pre-Auth Status</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Request Details</CardTitle>
                    <CardDescription>Update the status for request <span className="font-mono">{request.id}</span>.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={request.id} />
                        <input type="hidden" name="userId" value={user?.uid ?? ''} />
                        <input type="hidden" name="details" value={emailBody} />
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 p-4 border rounded-lg bg-muted/50">
                            <div><span className="font-semibold">Patient:</span> {request.fullName}</div>
                            <div><span className="font-semibold">Policy Number:</span> {request.policyNumber}</div>
                            <div><span className="font-semibold">Claim ID:</span> {request.claim_id || 'N/A'}</div>
                            <div className="lg:col-span-3"><span className="font-semibold">Amount:</span> {request.totalExpectedCost?.toLocaleString()}</div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Pre-Auth Status <span className="text-destructive">*</span></Label>
                            <Select 
                                name="status" 
                                required 
                                value={selectedStatus ?? undefined}
                                onValueChange={(value: PreAuthStatus) => setSelectedStatus(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {preAuthStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="claim_id">Official Claim ID</Label>
                            <Input id="claim_id" name="claim_id" defaultValue={request.claim_id ?? ''} placeholder="Enter official claim ID from TPA/Insurer" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount_sanctioned">Amount Sanctioned</Label>
                            <Input id="amount_sanctioned" name="amount_sanctioned" type="number" step="0.01" defaultValue={request.amount_sanctioned ?? undefined} placeholder="Enter amount sanctioned" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Notes / Reason</Label>
                            <Textarea id="reason" name="reason" defaultValue={request.reason ?? ""} placeholder="Add any relevant notes for this status update." />
                        </div>

                        {showEmailFields && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-semibold">Compose Reply</h3>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="to">To <span className="text-destructive">*</span></Label>
                                        <Input id="to" name="to" value={request.tpaEmail || ''} required={showEmailFields} readOnly />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="from">From</Label>
                                        <Input id="from" name="from" value={request.fromEmail || user?.email || ''} readOnly />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                                    <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required={showEmailFields} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="details-editor">Compose Email <span className="text-destructive">*</span></Label>
                                    <Editor
                                        editorState={editorState}
                                        onEditorStateChange={setEditorState}
                                        wrapperClassName="rounded-md border border-input bg-background"
                                        editorClassName="px-4 py-2 min-h-[150px]"
                                        toolbarClassName="border-b border-input"
                                    />
                                </div>
                                
                                <div className="space-y-2 pt-4 border-t">
                                    <Label>Available Documents to Attach</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {documentFields.map(({ key, label }) => {
                                            const doc = request[key] as { url: string; name: string; } | undefined;
                                            if (doc && typeof doc === 'object' && doc.url) {
                                                return (
                                                    <div key={key} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`attach-${key}`} 
                                                            name="email_attachments" 
                                                            value={JSON.stringify({ name: doc.name, url: doc.url })}
                                                            onCheckedChange={(checked) => {
                                                                const attachmentString = JSON.stringify({ name: doc.name, url: doc.url });
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
                            </div>
                        )}
                        
                        {state.message && state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton onClick={handleSubmit} />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}

    