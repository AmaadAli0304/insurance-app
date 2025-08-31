"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDoctors, Doctor } from "@/app/dashboard/doctors/actions";
import { Input } from "@/components/ui/input";

interface DoctorSearchProps {
  defaultDoctor?: {
    name: string;
    phone: string;
    qualification: string;
    reg_no: string;
  };
}

export function DoctorSearch({ defaultDoctor }: DoctorSearchProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const fetchedDoctors = await getDoctors();
        setDoctors(fetchedDoctors);
        
        // Set default selection if defaultDoctor is provided and found in the list
        if (defaultDoctor?.name) {
          const foundDoctor = fetchedDoctors.find(d => d.name === defaultDoctor.name);
          if (foundDoctor) {
            setSelectedDoctorId(String(foundDoctor.id));
          }
        }

      } catch (error) {
        console.error("Failed to fetch doctors", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDoctors();
  }, [defaultDoctor]);

  const handleSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const selectedDoctor = doctors.find(d => String(d.id) === doctorId);

    const form = document.querySelector('form');
    if (form && selectedDoctor) {
        (form.querySelector('#treat_doc_name') as HTMLInputElement).value = selectedDoctor.name || '';
        (form.querySelector('#treat_doc_number') as HTMLInputElement).value = selectedDoctor.phone || '';
        (form.querySelector('#treat_doc_qualification') as HTMLInputElement).value = selectedDoctor.qualification || '';
        (form.querySelector('#treat_doc_reg_no') as HTMLInputElement).value = selectedDoctor.reg_no || '';
    } else if (form && !selectedDoctor) {
        // Clear fields if no doctor is selected
        (form.querySelector('#treat_doc_name') as HTMLInputElement).value = '';
        (form.querySelector('#treat_doc_number') as HTMLInputElement).value = '';
        (form.querySelector('#treat_doc_qualification') as HTMLInputElement).value = '';
        (form.querySelector('#treat_doc_reg_no') as HTMLInputElement).value = '';
    }
  };

  // This hidden input will hold the doctor's name for the form submission
  const selectedDoctorName = doctors.find(d => String(d.id) === selectedDoctorId)?.name || defaultDoctor?.name || "";

  return (
    <div>
        <input type="hidden" id="treat_doc_name" name="treat_doc_name" value={selectedDoctorName} />
        <Select
            value={selectedDoctorId}
            onValueChange={handleSelect}
            required
            disabled={isLoading}
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