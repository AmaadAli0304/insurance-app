"use client";

import { useFormState, useFormStatus } from "react-dom";
import { handleSummarizeClaim } from "@/app/actions";
import type { Claim, Patient } from "@/lib/types";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Terminal } from "lucide-react";

interface ClaimDetailsProps {
  claim: Claim;
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

export function ClaimDetails({ claim, patient }: ClaimDetailsProps) {
  const [state, formAction] = useFormState(handleSummarizeClaim, { summary: "", error: "" });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Claim Details: {claim.id}</DialogTitle>
        <DialogDescription>
          Review the claim details for {patient.name}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><strong>Patient:</strong> {patient.name}</div>
        <div><strong>Date of Birth:</strong> {patient.dob}</div>
        <div><strong>Claim Amount:</strong> ${claim.claimAmount.toLocaleString()}</div>
        <div><strong>Status:</strong> {claim.status}</div>
        <div className="col-span-2"><strong>Plan ID:</strong> {claim.planId}</div>
        <div className="col-span-2 p-4 bg-muted rounded-md">
            <h4 className="font-semibold mb-2">Full Claim Details:</h4>
            <p className="text-muted-foreground">{claim.details}</p>
        </div>
      </div>
      
      <div className="space-y-4 pt-4">
        <form action={formAction}>
            <input type="hidden" name="claimDetails" value={claim.details} />
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
