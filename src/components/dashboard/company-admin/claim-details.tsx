
"use client";

import type { StaffingRequest, Patient } from "@/lib/types";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RequestDetailsProps {
  request: StaffingRequest;
  patient: Patient;
}


export function RequestDetails({ request, patient }: RequestDetailsProps) {
  
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Request Details: {request.id}</DialogTitle>
        <DialogDescription>
          Review the staffing request details for {patient.fullName}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><strong>Patient:</strong> {patient.fullName}</div>
        <div><strong>Date of Birth:</strong> {patient.dateOfBirth}</div>
        <div><strong>Request Amount:</strong> ${request.requestAmount?.toLocaleString()}</div>
        <div><strong>Status:</strong> {request.status}</div>
        <div className="col-span-2"><strong>Package ID:</strong> {request.packageId}</div>
        <div className="col-span-2 p-4 bg-muted rounded-md">
            <h4 className="font-semibold mb-2">Full Request Details:</h4>
            <p className="text-muted-foreground">{request.details}</p>
        </div>
      </div>
    </DialogContent>
  );
}
