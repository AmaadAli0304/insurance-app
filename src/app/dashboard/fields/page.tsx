"use client"

import { useState, useEffect, useCallback, useActionState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FilePlus2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getFields, handleAddField, getCompaniesForForm } from "./actions"
import type { Field } from './actions'
import { FieldsTable } from "./fields-table"
import { useFormStatus } from "react-dom"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import type { Company } from "@/lib/types";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <FilePlus2 className="mr-2" />
            {pending ? "Adding..." : "Add Field"}
        </Button>
    );
}


export default function FieldsPage() {
  const { user, role } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [companies, setCompanies] = useState<Pick<Company, "id" | "name">[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, formAction] = useActionState(handleAddField, { message: "", type: "initial" });
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const companyIdForFilter = role === 'Admin' ? 'all' : user?.companyId;
        if (!companyIdForFilter && role !== 'Admin') {
            setError("Could not determine company context.");
            setIsLoading(false);
            return;
        };

        const [fieldData, companyList] = await Promise.all([
            getFields(companyIdForFilter || 'all'),
            getCompaniesForForm()
        ]);
        
        setFields(fieldData);

        if (role === 'Admin') {
            setCompanies(companyList);
        } else if (role === 'Company Admin') {
            setCompanies(companyList.filter(c => c.id === user?.companyId));
        }

    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  }, [user?.companyId, role]);


  useEffect(() => {
    if (user) {
        loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
      if (state.type === 'success') {
          toast({ title: "Field", description: state.message, variant: "success" });
          formRef.current?.reset();
          loadData(); // Refresh the list
      } else if (state.type === 'error') {
          toast({ title: "Error", description: state.message, variant: "destructive" });
      }
  }, [state, toast, loadData]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Field</CardTitle>
                    <CardDescription>Define a new field for use in your forms.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} ref={formRef} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Field Name <span className="text-destructive">*</span></Label>
                            <Input id="name" name="name" placeholder="e.g., Clinical Notes" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Field Type <span className="text-destructive">*</span></Label>
                             <Select name="type" required defaultValue="Text">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Text">Text</SelectItem>
                                    <SelectItem value="Dropdown">Dropdown</SelectItem>
                                    <SelectItem value="Radio">Radio</SelectItem>
                                    <SelectItem value="Checkbox">Checkbox</SelectItem>
                                    <SelectItem value="Number">Number</SelectItem>
                                    <SelectItem value="Textarea">Textarea</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="companyId">Company <span className="text-destructive">*</span></Label>
                            <Select 
                                name="companyId" 
                                required 
                                defaultValue={role === 'Company Admin' ? user?.companyId : undefined}
                                disabled={isLoading || (role === 'Company Admin' && companies.length === 1)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                       
                        <div className="flex items-center space-x-2 pt-2">
                             <Switch id="required" name="required" />
                             <Label htmlFor="required">Is this field required?</Label>
                        </div>
                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Existing Fields</CardTitle>
                    <CardDescription>Manage the custom fields you have created.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading fields...</p>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Fetching Fields</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <FieldsTable fields={fields} onFieldDeleted={loadData} />
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
