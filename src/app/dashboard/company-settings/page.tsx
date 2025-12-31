
"use client";

import { useActionState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { handleCreateCompanySettingsTable } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useFormStatus } from "react-dom";
import { Database } from "lucide-react";

function SetupButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Database className="mr-2 h-4 w-4" />
            {pending ? "Creating Table..." : "Create Company Settings Table"}
        </Button>
    );
}

export default function CompanySettingsPage() {
  const [state, formAction] = useActionState(handleCreateCompanySettingsTable, { message: "", type: "initial" });
  const { toast } = useToast();

  useEffect(() => {
    if (state.type === 'success') {
      toast({ title: "Database", description: state.message, variant: "success" });
    } else if (state.type === 'error') {
      toast({ title: "Database Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Manage your company profile and settings here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Use the button below to set up the necessary table for company settings.</p>
            <form action={formAction}>
              <SetupButton />
            </form>
            {state.type === "error" && <p className="text-sm text-destructive mt-2">{state.message}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
