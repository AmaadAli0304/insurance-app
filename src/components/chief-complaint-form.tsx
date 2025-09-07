
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';

export interface Complaint {
  id: number;
  name: string;
  selected: boolean;
  durationValue: string;
  durationUnit: 'Day' | 'Month' | 'Year';
}

const initialComplaintNames: string[] = [
    'Diabetes',
    'Hypertension',
    'Heart disease',
    'Hyperlipidemia',
    'Osteoarthritis',
    'Asthma/COPD/Bronchitis',
    'Cancer',
    'Alcohol or drug abuse',
    'HIV/STD/related',
];

interface ChiefComplaintFormProps {
  initialData?: Complaint[];
  patientId?: string;
}

const MemoizedChiefComplaintForm = ({ initialData, patientId }: ChiefComplaintFormProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const initialMapped = initialComplaintNames.map((name, index) => {
      const existing = initialData?.find(d => d.name.toUpperCase() === name.toUpperCase());
      return {
        id: existing?.id ?? Date.now() + index,
        name: name,
        selected: existing?.selected ?? false,
        durationValue: existing?.durationValue ?? '',
        durationUnit: existing?.durationUnit ?? 'Day',
      };
    });
    
    // Add any custom complaints from initialData that are not in the default list
    const customComplaints = initialData?.filter(d => !initialComplaintNames.includes(d.name)) || [];
    setComplaints([...initialMapped, ...customComplaints]);

  }, [initialData]);


  const handleToggle = (id: number) => {
    setComplaints(
      complaints.map(c =>
        c.id === id ? { ...c, selected: !c.selected, durationValue: !c.selected ? c.durationValue : '', durationUnit: !c.selected ? c.durationUnit : 'Day' } : c
      )
    );
  };

  const handleInputChange = (id: number, field: 'durationValue' | 'durationUnit' | 'name', value: string) => {
    setComplaints(
      complaints.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addComplaint = () => {
    const newComplaint: Complaint = {
      id: Date.now(),
      name: '',
      selected: true,
      durationValue: '',
      durationUnit: 'Day',
    };
    setComplaints([...complaints, newComplaint]);
  };
  
  const removeComplaint = (id: number) => {
      setComplaints(complaints.filter(c => c.id !== id));
  };


  return (
    <Card>
        <CardHeader>
            <CardTitle>Medical History</CardTitle>
        </CardHeader>
      <CardContent>
        <input type="hidden" name="chiefComplaints" value={JSON.stringify(complaints.filter(c => c.selected))} />
        <div className="overflow-x-auto">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-4 items-center border-b pb-2 mb-2 font-medium">
                <Label className="px-2">#</Label>
                <Label>Complaint</Label>
                <Label>Duration</Label>
                <Label>Unit</Label>
                <div className="w-8"></div>
            </div>
             {complaints.map((complaint, index) => (
                <div key={complaint.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-4 items-center mb-2">
                    <Checkbox
                        id={`complaint-checkbox-${complaint.id}`}
                        checked={complaint.selected}
                        onCheckedChange={() => handleToggle(complaint.id)}
                    />
                    <Input
                        value={complaint.name}
                        onChange={(e) => handleInputChange(complaint.id, 'name', e.target.value)}
                        placeholder="Enter complaint"
                        disabled={!complaint.selected || initialComplaintNames.includes(complaint.name)}
                    />
                    <Input
                        type="number"
                        value={complaint.durationValue}
                        onChange={(e) => handleInputChange(complaint.id, 'durationValue', e.target.value)}
                        disabled={!complaint.selected}
                        placeholder="e.g. 3"
                    />
                    <Select
                        value={complaint.durationUnit}
                        onValueChange={(value) => handleInputChange(complaint.id, 'durationUnit', value)}
                        disabled={!complaint.selected}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Day">Day(s)</SelectItem>
                            <SelectItem value="Month">Month(s)</SelectItem>
                            <SelectItem value="Year">Year(s)</SelectItem>
                        </SelectContent>
                    </Select>
                     <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeComplaint(complaint.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={initialComplaintNames.includes(complaint.name)}
                     >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
         <Button type="button" variant="outline" size="sm" onClick={addComplaint} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medical History
        </Button>
      </CardContent>
    </Card>
  );
}
export const ChiefComplaintForm = React.memo(MemoizedChiefComplaintForm);

    