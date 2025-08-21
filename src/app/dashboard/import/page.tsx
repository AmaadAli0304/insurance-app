
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleImportCompanies } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Importing..." : "Import Companies"}
        </Button>
    );
}

export default function ImportPage() {
    const [state, formAction] = useActionState(handleImportCompanies, { message: "", type: undefined });
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.type === 'success') {
            toast({
                title: "Import Successful",
                description: state.message,
                variant: "success",
            });
            formRef.current?.reset();
        } else if (state.type === 'error') {
            toast({
                title: "Import Error",
                description: state.message,
                variant: "destructive"
            });
        }
    }, [state, toast]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Import Insurance Companies</CardTitle>
                    <CardDescription>
                        Upload an XLSX file with company data. Ensure the file has columns
                        named &quot;All Insurers Name&quot; and &quot;Email ID&quot;.
                    </CardDescription>
                </CardHeader>
                <form action={formAction} ref={formRef}>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="file">XLSX File</Label>
                             <div className="flex items-center gap-2">
                                <Input id="file" name="file" type="file" required accept=".xlsx" className="w-full md:w-auto" />
                            </div>
                        </div>

                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
