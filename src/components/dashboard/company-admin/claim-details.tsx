
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { handleSummarizeRequest } from "@/app/actions";
import type { StaffingRequest, Patient } from "@/lib/types";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Terminal } from "lucide-react";

interface RequestDetailsProps {
  request: StaffingRequest;
  patient: Patient;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? (
        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Sparkles className="h-4 w-4" /> Generate Summary
        </>
      )}
    </Button>
  );
}

export function RequestDetails({ request, patient }: RequestDetailsProps) {
  const [state, formAction] = useFormState(handleSummarizeRequest, { summary: "", error: "" });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Request Details: {request.id}</DialogTitle>
        <DialogDescription>
          Review the staffing request details for {patient.name}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><strong>Patient:</strong> {patient.name}</div>
        <div><strong>Date of Birth:</strong> {patient.dob}</div>
        <div><strong>Request Amount:</strong> ${request.requestAmount.toLocaleString()}</div>
        <div><strong>Status:</strong> {request.status}</div>
        <div className="col-span-2"><strong>Package ID:</strong> {request.packageId}</div>
        <div className="col-span-2 p-4 bg-muted rounded-md">
            <h4 className="font-semibold mb-2">Full Request Details:</h4>
            <p className="text-muted-foreground">{request.details}</p>
        </div>
      </div>
      
      <div className="space-y-4 pt-4">
        <form action={formAction}>
            <input type="hidden" name="requestDetails" value={request.details} />
            <SubmitButton />
        </form>
        
        {state.summary && (
            <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI-Generated Summary</AlertTitle>
                <AlertDescription>{state.summary}</AlertDescription>
            </Alert>
        )}

        {state.error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
        )}
      </div>

    </DialogContent>
  );
}
