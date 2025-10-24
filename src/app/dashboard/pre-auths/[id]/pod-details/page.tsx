
"use client";

import { useState, useRef, useEffect, useActionState, ChangeEvent } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Upload, XCircle, File as FileIcon, Eye, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { useAuth } from "@/components/auth-provider";
import { handleSavePodDetails, getPreAuthRequestById } from "@/app/dashboard/pre-auths/actions";
import { useToast } from "@/hooks/use-toast";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { getPresignedUrl } from "@/app/dashboard/staff/actions";
import { useParams, useRouter, notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StaffingRequest } from "@/lib/types";


const Editor = dynamic(
  () => import('react-draft-wysiwyg').then(mod => mod.Editor),
  { ssr: false }
);

type PodType = "Courier" | "Portal" | "Email";

async function uploadFile(file: File): Promise<{ publicUrl: string } | { error: string }> {
    const key = `uploads/pod/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const presignedUrlResult = await getPresignedUrl(key, file.type);
    if ("error" in presignedUrlResult) {
        return { error: presignedUrlResult.error };
    }
    const { url, publicUrl } = presignedUrlResult;
    const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!res.ok) return { error: "Failed to upload file to S3." };
    return { publicUrl };
}

const FileUpload = ({ label, name, onUploadComplete, isRequired }: { label: string; name: string; onUploadComplete: (fieldName: string, name: string, url: string) => void; isRequired?: boolean; }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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

    return (
         <div className="space-y-2">
            <Label htmlFor={name}>{label} {isRequired && <span className="text-destructive">*</span>}</Label>
             <div className="flex items-center gap-2">
                 <Input ref={fileInputRef} id={name} type="file" onChange={handleFileChange} disabled={isUploading} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" required={isRequired && !fileUrl} />
                 {isUploading && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <Button variant="ghost" size="icon" onClick={handleCancelUpload}>
                            <XCircle className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                )}
                {fileUrl && !isUploading && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground truncate max-w-[100px]">{fileName}</span>
                        <Button variant="outline" size="icon" asChild>
                            <Link href={fileUrl} target="_blank">
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Submitting..." : "Submit"}
    </Button>
  );
}

export default function PodDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const [request, setRequest] = useState<StaffingRequest | null>(null);
  const [podType, setPodType] = useState<PodType>("Courier");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [state, formAction] = useActionState(handleSavePodDetails, { message: "", type: "initial" });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [documentUrls, setDocumentUrls] = useState<Record<string, { url: string; name: string; } | null>>({});

  useEffect(() => {
    if (state.type === "success") {
      toast({ title: "Success", description: state.message });
      router.push('/dashboard/pre-auths');
    } else if (state.type === "error") {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, router]);
  
  useEffect(() => {
    if (!requestId) return;
    setIsLoading(true);
    getPreAuthRequestById(requestId)
      .then(data => {
        if (!data) notFound();
        else setRequest(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [requestId]);

  const handleDocumentUploadComplete = (fieldName: string, name: string, url: string) => {
    setDocumentUrls(prev => ({ ...prev, [fieldName]: { url, name } }));
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/pre-auths">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            <h1 className="text-lg font-semibold md:text-2xl">Add POD Details</h1>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Proof of Delivery</CardTitle>
        </CardHeader>
        <CardContent>
            <form action={formAction}>
                <input type="hidden" name="requestId" value={requestId} />
                <input type="hidden" name="podType" value={podType} />
                <input type="hidden" name="userId" value={user?.uid ?? ''} />
                <input type="hidden" name="userName" value={user?.name ?? ''} />
                {Object.entries(documentUrls).map(([key, value]) => 
                    value ? (
                        <React.Fragment key={key}>
                            <input type="hidden" name={`${key}_url`} value={value.url} />
                            <input type="hidden" name={`${key}_name`} value={value.name} />
                        </React.Fragment>
                    ) : null
                 )}

                <div className="space-y-6">
                    <RadioGroup defaultValue="Courier" onValueChange={(value: PodType) => setPodType(value)}>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Courier" id="r1" />
                            <Label htmlFor="r1">Courier</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Portal" id="r2" />
                            <Label htmlFor="r2">Portal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Email" id="r3" />
                            <Label htmlFor="r3">Email</Label>
                            </div>
                        </div>
                    </RadioGroup>

                    {podType === 'Courier' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="courierName">Courier Name</Label>
                                    <Input id="courierName" name="courierName" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pod_number">POD Number</Label>
                                    <Input id="pod_number" name="pod_number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="refNo">Ref No</Label>
                                    <Input id="refNo" name="ref_no" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label>Date of Sent</Label>
                                    <input type="hidden" name="date_of_sent" value={date?.toISOString() ?? ''} />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                <FileUpload label="POD Copy" name="pod_copy_url" onUploadComplete={handleDocumentUploadComplete} />
                            </div>
                        </div>
                    )}

                    {podType === 'Portal' && (
                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <input type="hidden" name="date_of_sent" value={date?.toISOString() ?? ''} />
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="refNo">Reference Number</Label>
                                <Input id="refNo" name="ref_no" />
                            </div>
                             <FileUpload label="Screenshot Upload" name="screenshot_url" onUploadComplete={handleDocumentUploadComplete} isRequired />
                        </div>
                    )}

                    {podType === 'Email' && (
                        <div className="space-y-4">
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from">From</Label>
                                    <Input id="from" name="from" value={request?.fromEmail || user?.email || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="to">To</Label>
                                    <Input id="to" name="to" value={request?.tpaEmail || ''} readOnly />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="cc">CC</Label>
                                <Input id="cc" name="cc" placeholder="recipient1@example.com, recipient2@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <input type="hidden" name="date_of_sent" value={date?.toISOString() ?? ''} />
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Email Content</Label>
                                <input type="hidden" name="email_body" value={draftToHtml(convertToRaw(editorState.getCurrentContent()))} />
                                <Editor
                                    editorState={editorState}
                                    onEditorStateChange={setEditorState}
                                    wrapperClassName="rounded-md border border-input bg-background"
                                    editorClassName="px-4 py-2 min-h-[150px]"
                                    toolbarClassName="border-b border-input"
                                />
                            </div>
                             <div className="space-y-2">
                                <FileUpload label="Attach File" name="attachment_1" onUploadComplete={handleDocumentUploadComplete} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/pre-auths">Cancel</Link>
                    </Button>
                    <SubmitButton />
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
