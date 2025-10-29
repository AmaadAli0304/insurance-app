
"use client";

import * as React from "react";
import { useActionState, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateRequest, getPreAuthRequestById } from "../../actions";
import { getPresignedUrl } from "@/app/dashboard/staff/actions";
import Link from "next/link";
import { ArrowLeft, Loader2, File as FileIcon, Upload, Eye, XCircle } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { StaffingRequest, PreAuthStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Checkbox } from "@/components/ui/checkbox";

let htmlToDraft: any = null;
if (typeof window === 'object') {
  htmlToDraft = require('html-to-draftjs').default;
}

const Editor = dynamic(
  () => import('react-draft-wysiwyg').then(mod => mod.Editor),
  { ssr: false }
);

async function uploadFile(file: File): Promise<{ publicUrl: string } | { error: string }> {
    const key = `uploads/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    
    const presignedUrlResult = await getPresignedUrl(key, file.type);
    if ("error" in presignedUrlResult) {
        return { error: presignedUrlResult.error };
    }

    const { url, publicUrl } = presignedUrlResult;

    const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type,
        },
    });

    if (!res.ok) {
        return { error: "Failed to upload file to S3." };
    }
    
    return { publicUrl };
}

const FileUploadField = React.memo(({ label, name, onUploadComplete, initialUrl, onFileRemove }: { label: string; name: string; onUploadComplete: (fieldName: string, name: string, url: string) => void; initialUrl?: string | null; onFileRemove: (fieldName: string) => void; }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(initialUrl || null);
    const [fileName, setFileName] = useState<string | null>(initialUrl ? label : null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const result = await uploadFile(file);

            if ("publicUrl" in result) {
                setFileUrl(result.publicUrl);
                setFileName(file.name);
                onUploadComplete(name, file.name, result.publicUrl);
                toast({ title: "Success", description: `${label} uploaded.`, variant: "success" });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
            setIsUploading(false);
        }
    };
    
    const handleCancelUpload = () => {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveFile = () => {
        setFileUrl(null);
        setFileName(null);
        onFileRemove(name);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    if (initialUrl && !fileUrl) {
         setFileUrl(initialUrl);
    }
    
    if (fileUrl) {
        return (
             <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{fileName || label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-6 w-6" asChild>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3" />
                        </a>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleRemoveFile}>
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
                <Input ref={fileInputRef} id={name} name={`${name}-file`} type="file" onChange={handleFileChange} disabled={isUploading} className="w-full h-9 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {isUploading && (
                    <Button variant="ghost" size="icon" onClick={handleCancelUpload}>
                        <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                )}
            </div>
        </div>
    );
});
FileUploadField.displayName = 'FileUploadField';


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
    'Enhancement Approval', 
    'Final Discharge sent', 
    'Final Approval', 
    'Initial Approval',
    'Settled',
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
    
    const [documentUrls, setDocumentUrls] = useState<Record<string, { url: string; name: string; } | null>>({});
    const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);

    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [emailBody, setEmailBody] = useState("");
    const [subject, setSubject] = useState("");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

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
    
    const handleDocumentUploadComplete = (fieldName: string, name: string, url: string) => {
        setDocumentUrls(prev => ({ ...prev, [fieldName]: { url, name } }));
        const attachmentString = JSON.stringify({ name, url });
        setSelectedAttachments(prev => [...prev, attachmentString]);
    };

    const handleFileRemove = (fieldName: string) => {
        const removedDoc = documentUrls[fieldName];
        if(removedDoc){
            const attachmentString = JSON.stringify({ name: removedDoc.name, url: removedDoc.url });
            setSelectedAttachments(prev => prev.filter(att => att !== attachmentString));
        }
        setDocumentUrls(prev => ({ ...prev, [fieldName]: null }));
    };

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
                        <input type="hidden" name="patientId" value={request.patientId} />
                        <input type="hidden" name="userId" value={user?.uid ?? ''} />
                        <input type="hidden" name="details" value={emailBody} />
                         {Object.entries(documentUrls).map(([key, value]) => 
                            value ? (
                                <React.Fragment key={key}>
                                    <input type="hidden" name={`${key}_url`} value={value.url} />
                                    <input type="hidden" name={`${key}_name`} value={value.name} />
                                </React.Fragment>
                            ) : null
                         )}
                         {selectedAttachments.map((attachment, index) => (
                             <input key={index} type="hidden" name="email_attachments" value={attachment} />
                         ))}

                        
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
                        
                        {selectedStatus === 'Final Approval' && (
                            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="final_hospital_bill">Final Hospital Bill <span className="text-destructive">*</span></Label>
                                    <Input id="final_hospital_bill" name="final_hospital_bill" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter final bill amount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hospital_discount">Hospital Discount <span className="text-destructive">*</span></Label>
                                    <Input id="hospital_discount" name="hospital_discount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter discount amount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mou_discount">MOU Discount <span className="text-destructive">*</span></Label>
                                    <Input id="mou_discount" name="mou_discount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter MOU discount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nm_deductions">NM Deductions <span className="text-destructive">*</span></Label>
                                    <Input id="nm_deductions" name="nm_deductions" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter NM deductions" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="co_pay">Co-Pay <span className="text-destructive">*</span></Label>
                                    <Input id="co_pay" name="co_pay" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter Co-Pay amount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="final_amount">Final Authorised Amount <span className="text-destructive">*</span></Label>
                                    <Input id="final_amount" name="final_amount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter final authorised amount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount_sanctioned">Amount Paid by insured <span className="text-destructive">*</span></Label>
                                    <Input id="amount_sanctioned" name="amount_sanctioned" type="text" inputMode="decimal" pattern="[0-9.]*" defaultValue={request.amount_sanctioned ?? undefined} placeholder="Enter amount paid by insured" required />
                                </div>
                            </div>
                        )}
                        
                        {selectedStatus === 'Settled' && (
                           <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="final_amount">Final Authorised Amount <span className="text-destructive">*</span></Label>
                                    <Input id="final_amount" name="final_amount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter final authorised amount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nm_deductions">Deduction <span className="text-destructive">*</span></Label>
                                    <Input id="nm_deductions" name="nm_deductions" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter deduction amount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tds">TDS <span className="text-destructive">*</span></Label>
                                    <Input id="tds" name="tds" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter TDS amount" required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="final_settle_amount">Final Settlement Amount <span className="text-destructive">*</span></Label>
                                    <Input id="final_settle_amount" name="final_settle_amount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter final settlement amount" required />
                                </div>
                               <div className="space-y-2">
                                   <Label htmlFor="amount">Net Amount Credited <span className="text-destructive">*</span></Label>
                                   <Input id="amount" name="amount" type="text" inputMode="decimal" pattern="[0-9.]*" defaultValue={request.amount_sanctioned ?? undefined} placeholder="Enter net amount credited" required />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="mou_discount">MOU Discount <span className="text-destructive">*</span></Label>
                                   <Input id="mou_discount" name="mou_discount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter MOU discount" required />
                               </div>
                                <div className="space-y-2">
                                   <Label htmlFor="utr_no">UTR No <span className="text-destructive">*</span></Label>
                                   <Input id="utr_no" name="utr_no" placeholder="Enter UTR No" required />
                               </div>
                                <div className="space-y-2">
                                   <Label htmlFor="date_settlement">Date of Settlement <span className="text-destructive">*</span></Label>
                                   <Input id="date_settlement" name="date_settlement" type="date" required />
                               </div>
                           </div>
                        )}

                        {selectedStatus === 'Final Discharge sent' && (
                            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="pharmacy_bill">Pharmacy Bill <span className="text-destructive">*</span></Label>
                                    <Input id="pharmacy_bill" name="pharmacy_bill" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter Pharmacy Bill" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lab_bill">Lab Bill <span className="text-destructive">*</span></Label>
                                    <Input id="lab_bill" name="lab_bill" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter Lab Bill" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ct_scan_charges">CT Scan Charges <span className="text-destructive">*</span></Label>
                                    <Input id="ct_scan_charges" name="ct_scan_charges" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter CT Scan Charges" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mri_charges">MRI Charges <span className="text-destructive">*</span></Label>
                                    <Input id="mri_charges" name="mri_charges" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter MRI Charges" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="usg_charges">USG Charge <span className="text-destructive">*</span></Label>
                                    <Input id="usg_charges" name="usg_charges" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter USG Charge" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="other_charges">Other Charges <span className="text-destructive">*</span></Label>
                                    <Input id="other_charges" name="other_charges" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter Other Charges" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="xray_charges">X-ray Charges <span className="text-destructive">*</span></Label>
                                    <Input id="xray_charges" name="xray_charges" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter X-ray Charges" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mou_discount">MOU Discount <span className="text-destructive">*</span></Label>
                                    <Input id="mou_discount" name="mou_discount" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter MOU Discount" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="implant_charges">Implant Charges</Label>
                                    <Input id="implant_charges" name="implant_charges" type="text" inputMode="decimal" pattern="[0-9.]*" placeholder="Enter Implant Charges" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="amount_sanctioned">Amount Sanctioned</Label>
                                    <Input id="amount_sanctioned" name="amount_sanctioned" type="text" inputMode="decimal" pattern="[0-9.]*" defaultValue={request.amount_sanctioned ?? undefined} placeholder="Enter amount sanctioned" />
                                </div>
                            </div>
                        )}

                        {selectedStatus !== 'Final Approval' && selectedStatus !== 'Settled' && selectedStatus !== 'Final Discharge sent' && (
                           <div className="space-y-2">
                               <Label htmlFor="amount_sanctioned">Amount Sanctioned</Label>
                               <Input id="amount_sanctioned" name="amount_sanctioned" type="text" inputMode="decimal" pattern="[0-9.]*" defaultValue={request.amount_sanctioned ?? undefined} placeholder="Enter amount sanctioned" />
                           </div>
                        )}


                        {selectedStatus !== 'Final Approval' && (
                            <div className="space-y-2">
                                <Label htmlFor="reason">Notes / Reason</Label>
                                <Textarea id="reason" name="reason" defaultValue={request.reason ?? ""} placeholder="Add any relevant notes for this status update." />
                            </div>
                        )}

                        {showEmailFields && isClient && (
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
                                    <Label htmlFor="cc">CC</Label>
                                    <Input id="cc" name="cc" placeholder="recipient1@example.com, recipient2@example.com" />
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
                                    <Label>Documents</Label>
                                    <p className="text-sm text-muted-foreground">Attach existing documents or upload new ones.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {documentFields.map(({ key, label }) => {
                                            const doc = request[key as keyof StaffingRequest] || documentUrls[key];
                                            const docUrl = doc && typeof doc === 'object' && 'url' in doc ? (doc as {url:string}).url : null;
                                            const docName = doc && typeof doc === 'object' && 'name' in doc ? (doc as {name:string}).name : label;

                                            return (
                                                <div key={key}>
                                                  {docUrl ? (
                                                    <div className="flex items-center gap-2">
                                                      <Checkbox
                                                        id={`attach-${key}`}
                                                        value={JSON.stringify({ name: docName, url: docUrl })}
                                                        checked={selectedAttachments.includes(JSON.stringify({ name: docName, url: docUrl }))}
                                                        onCheckedChange={(checked) => {
                                                          const attachmentString = JSON.stringify({ name: docName, url: docUrl });
                                                          setSelectedAttachments(prev => 
                                                              checked 
                                                              ? [...prev, attachmentString]
                                                              : prev.filter(item => item !== attachmentString)
                                                          );
                                                        }}
                                                      />
                                                      <Label htmlFor={`attach-${key}`} className="font-normal flex items-center gap-1 cursor-pointer text-green-600">
                                                        <FileIcon className="h-4 w-4" />
                                                        {label} (Attached)
                                                      </Label>
                                                    </div>
                                                  ) : (
                                                    <FileUploadField 
                                                        label={label} 
                                                        name={key} 
                                                        onUploadComplete={handleDocumentUploadComplete} 
                                                        onFileRemove={handleFileRemove}
                                                    />
                                                  )}
                                                </div>
                                            );
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
