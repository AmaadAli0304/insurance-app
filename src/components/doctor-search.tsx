
"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Doctor } from "@/app/dashboard/patients/actions";

interface DoctorSearchProps {
  doctors: Doctor[];
  defaultDoctorId?: number;
  onDoctorSelect: (doctor: Doctor | null) => void;
}

const MemoizedDoctorSearch = ({ doctors, defaultDoctorId, onDoctorSelect }: DoctorSearchProps) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId?.toString() ?? "");

  useEffect(() => {
    if (defaultDoctorId) {
        setSelectedDoctorId(String(defaultDoctorId));
    }
  }, [defaultDoctorId]);

  const handleSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const selectedDoctor = doctors?.find(d => String(d.id) === doctorId) || null;
    onDoctorSelect(selectedDoctor);
  };

  const selectedDoctor = doctors?.find(d => String(d.id) === selectedDoctorId);

  return (
    <div>
        <input type="hidden" name="doctor_id" value={selectedDoctorId} />
        <input type="hidden" name="treat_doc_name" value={selectedDoctor?.name || ""} />
        <Select
            value={selectedDoctorId}
            onValueChange={handleSelect}
            required
            disabled={!doctors || doctors.length === 0}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
            </SelectTrigger>
            <SelectContent>
                {doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                        {doctor.name}{doctor.qualification && ` (${doctor.qualification})`}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
  );
}

export const DoctorSearch = React.memo(MemoizedDoctorSearch);
