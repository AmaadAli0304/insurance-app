
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { getDoctors, Doctor } from "@/app/dashboard/doctors/actions";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Label } from "./ui/label";

interface DoctorSearchProps {
  defaultDoctor?: {
    name: string;
    phone: string;
    qualification: string;
    reg_no: string;
  };
}

export function DoctorSearch({ defaultDoctor }: DoctorSearchProps) {
  const [query, setQuery] = useState(defaultDoctor?.name || "");
  const [results, setResults] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async () => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const doctors = await getDoctors(); // Fetches all doctors
      const filteredDoctors = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setResults(filteredDoctors);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (doctor: Doctor) => {
    setQuery(doctor.name);

    // Find the form and update the other doctor fields
    const form = containerRef.current?.closest('form');
    if (form) {
      (form.querySelector('#treat_doc_number') as HTMLInputElement).value = doctor.phone || '';
      (form.querySelector('#treat_doc_qualification') as HTMLInputElement).value = doctor.qualification || '';
      (form.querySelector('#treat_doc_reg_no') as HTMLInputElement).value = doctor.reg_no || '';
    }

    setIsOpen(false);
  };
  
  // Effect to populate form if defaultDoctor is provided and changes
  useEffect(() => {
    if (defaultDoctor?.name) {
       setQuery(defaultDoctor.name);
    }
  }, [defaultDoctor]);

  return (
    <div className="relative" ref={containerRef}>
        <Input
            type="text"
            id="treat_doc_name"
            name="treat_doc_name"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            required
            placeholder="Search for a doctor..."
            autoComplete="off"
        />
        {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isLoading && <div className="p-2 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
            {!isLoading && debouncedQuery.length > 1 && results.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">No results found.</div>
            )}
            <ul>
                {results.map((doctor) => (
                <li
                    key={doctor.id}
                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleSelect(doctor)}
                >
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                </li>
                ))}
            </ul>
            </div>
        )}
    </div>
  );
}
