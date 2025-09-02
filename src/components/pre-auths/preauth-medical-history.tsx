
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChiefComplaintForm, Complaint } from '@/components/chief-complaint-form';

interface PreAuthMedicalHistoryProps {
  initialData: Complaint[];
}

const MemoizedPreAuthMedicalHistory = ({ initialData }: PreAuthMedicalHistoryProps) => {
  const [complaints, setComplaints] = useState(initialData);

  useEffect(() => {
    setComplaints(initialData);
  }, [initialData]);

  return (
    <Card>
      <AccordionItem value="medical-history">
        <CardHeader>
          <AccordionTrigger>
            <CardTitle>G. Medical History</CardTitle>
          </AccordionTrigger>
        </CardHeader>
        <AccordionContent>
          <CardContent>
            <ChiefComplaintForm initialData={complaints} />
          </CardContent>
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
};

export const PreAuthMedicalHistory = React.memo(MemoizedPreAuthMedicalHistory);
