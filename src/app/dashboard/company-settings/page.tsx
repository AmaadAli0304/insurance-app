
"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCompanySettings, addOrUpdateCompanySettings, CompanySettings } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useFormStatus } from "react-dom";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "Saving..." : "Save Settings"}
        </Button>
    );
}

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const [state, formAction] = useActionState(addOrUpdateCompanySettings, { message: "", type: "initial" });
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.companyId) {
      getCompanySettings(user.companyId)
        .then(data => {
          setSettings(data);
        })
        .catch(err => {
          toast({ title: "Error", description: "Failed to load company settings.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (state.type === 'success') {
      toast({ title: "Success", description: state.message, variant: "success" });
    } else if (state.type === 'error') {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>Manage your company's public and banking details.</CardDescription>
        </CardHeader>
        <form action={formAction}>
            <input type="hidden" name="companyId" value={user?.companyId ?? ''} />
            <input type="hidden" name="userId" value={user?.uid ?? ''} />
            <input type="hidden" name="userName" value={user?.name ?? ''} />
            <CardContent className="space-y-8">
                <section>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Business Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input id="name" name="name" defaultValue={settings?.name ?? ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" defaultValue={settings?.address ?? ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gst_no">GST No.</Label>
                            <Input id="gst_no" name="gst_no" defaultValue={settings?.gst_no ?? ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pan_no">PAN No.</Label>
                            <Input id="pan_no" name="pan_no" defaultValue={settings?.pan_no ?? ''} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="contact_no">Contact No.</Label>
                            <Input id="contact_no" name="contact_no" defaultValue={settings?.contact_no ?? ''} />
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Banking Details</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="account_name">Account Name</Label>
                            <Input id="account_name" name="account_name" defaultValue={settings?.account_name ?? ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Bank Name</Label>
                            <Input id="bank_name" name="bank_name" defaultValue={settings?.bank_name ?? ''} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="branch">Branch</Label>
                            <Input id="branch" name="branch" defaultValue={settings?.branch ?? ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account_no">Account No.</Label>
                            <Input id="account_no" name="account_no" defaultValue={settings?.account_no ?? ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ifsc_code">IFSC Code</Label>
                            <Input id="ifsc_code" name="ifsc_code" defaultValue={settings?.ifsc_code ?? ''} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="banking_details">Other Banking Details</Label>
                            <Textarea id="banking_details" name="banking_details" defaultValue={settings?.banking_details ?? ''} />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end">
                  <SubmitButton />
                </div>
                {state.type === "error" && <p className="text-sm text-destructive mt-2 text-right">{state.message}</p>}
            </CardContent>
        </form>
      </Card>
    </div>
  );
}
