
"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Doctor } from "@/app/dashboard/patients/actions";

interface DoctorSearchProps {
  doctors: Doctor[];
  defaultDoctorId?: number;
}

export function DoctorSearch({ doctors, defaultDoctorId }: DoctorSearchProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId?.toString() ?? "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultDoctorId) {
        setSelectedDoctorId(String(defaultDoctorId));
    }
  }, [defaultDoctorId]);

  const handleSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const selectedDoctor = doctors.find(d => String(d.id) === doctorId);

    const form = document.querySelector('form');
    if (form && selectedDoctor) {
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_name"]'))!.value = selectedDoctor.name || '';
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_number"]'))!.value = selectedDoctor.phone || '';
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_qualification"]'))!.value = selectedDoctor.qualification || '';
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_reg_no"]'))!.value = selectedDoctor.reg_no || '';
    } else if (form && !selectedDoctor) {
        // Clear fields if no doctor is selected
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_name"]'))!.value = '';
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_number"]'))!.value = '';
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_qualification"]'))!.value = '';
        (form.querySelector<HTMLInputElement>('input[name="treat_doc_reg_no"]'))!.value = '';
    }
  };

  const selectedDoctorName = doctors.find(d => String(d.id) === selectedDoctorId)?.name || "";

  return (
    <div>
        <input type="hidden" name="doctor_id" value={selectedDoctorId} />
        <input type="hidden" name="treat_doc_name" value={selectedDoctorName} />
        <Select
            value={selectedDoctorId}
            onValueChange={handleSelect}
            required
            disabled={isLoading || doctors.length === 0}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
            </SelectTrigger>
            <SelectContent>
                {isLoading ? (
                    <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                ) : (
                    doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={String(doctor.id)}>
                            {doctor.name}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    </div>
  );
}
