"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface Complaint {
  id: number;
  name: string;
  selected: boolean;
  durationValue: string;
  durationUnit: 'Day' | 'Month' | 'Year';
}

const initialComplaints: Omit<Complaint, 'id' | 'selected' | 'durationValue' | 'durationUnit'>[] = [
  { name: 'FEVER' },
  { name: 'BODY ACHE' },
  { name: 'COLD' },
  { name: 'VOMITING' },
  { name: 'COUGH' },
  { name: 'DIARRHEA' },
  { name: 'SORE THROAT' },
  { name: 'LOSS OF SMELL OR TASTE' },
  { name: 'BREATHLESSNESS' },
];

interface ChiefComplaintFormProps {
  initialData?: Complaint[];
  patientId?: string;
}

export function ChiefComplaintForm({ initialData, patientId }: ChiefComplaintFormProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    initialComplaints.map((c, index) => {
      const existing = initialData?.find(d => d.name.toUpperCase() === c.name.toUpperCase());
      return {
        id: existing?.id ?? Date.now() + index,
        name: c.name,
        selected: existing?.selected ?? false,
        durationValue: existing?.durationValue ?? '',
        durationUnit: existing?.durationUnit ?? 'Day',
      };
    })
  );

  const handleToggle = (id: number) => {
    setComplaints(
      complaints.map(c =>
        c.id === id ? { ...c, selected: !c.selected } : c
      )
    );
  };

  const handleInputChange = (id: number, field: 'durationValue' | 'durationUnit', value: string) => {
    setComplaints(
      complaints.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addComplaint = () => {
    setComplaints([...complaints, { 
        id: Date.now(), 
        name: '', 
        selected: true, 
        durationValue: '', 
        durationUnit: 'Day' 
    }]);
  };
  
  const removeComplaint = (id: number) => {
    setComplaints(complaints.filter(c => c.id !== id));
  }

  return (
    <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>H. Chief Complaint</CardTitle>
                    <CardDescription>Select complaints and specify their duration.</CardDescription>
                </div>
            </div>
        </CardHeader>
      <CardContent>
        <input type="hidden" name="chiefComplaints" value={JSON.stringify(complaints.filter(c => c.selected))} />
        <div className="overflow-x-auto">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-4 items-center border-b pb-2 mb-2 font-medium">
                <Label className="px-2">#</Label>
                <Label>Complaint</Label>
                <Label>From</Label>
                <Label>To</Label>
                <Label className="sr-only">Actions</Label>
            </div>
             {complaints.map((complaint) => (
                <div key={complaint.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-4 items-center mb-2">
                    <Checkbox
                        checked={complaint.selected}
                        onCheckedChange={() => handleToggle(complaint.id)}
                    />
                    <Input
                        value={complaint.name}
                        onChange={(e) => setComplaints(complaints.map(c => c.id === complaint.id ? { ...c, name: e.target.value } : c))}
                        placeholder="Enter complaint"
                        disabled={!complaint.selected}
                    />
                    <Select
                        value={complaint.durationUnit}
                        onValueChange={(value) => handleInputChange(complaint.id, 'durationUnit', value)}
                        disabled={!complaint.selected}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select From" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Day">Day</SelectItem>
                            <SelectItem value="Month">Month</SelectItem>
                            <SelectItem value="Year">Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        value={complaint.durationValue}
                        onChange={(e) => handleInputChange(complaint.id, 'durationValue', e.target.value)}
                        disabled={!complaint.selected}
                        placeholder="e.g. 3"
                    />
                     <Button type="button" variant="ghost" size="icon" onClick={() => removeComplaint(complaint.id)} disabled={initialComplaints.some(c => c.name === complaint.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
