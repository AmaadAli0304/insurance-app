
"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddTPA } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add TPA"}
        </Button>
    );
}

export default function NewTPAPage() {
    const [state, formAction] = useActionState(handleAddTPA, { message: "", type: undefined });
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state.type === 'success') {
            toast({
                title: "TPA",
                description: "TPA added successfully",
                variant: "success",
            });
            router.push('/dashboard/tpas');
        } else if (state.type === 'error') {
            toast({
                title: "Error",
                description: state.message,
                variant: "destructive"
            });
        }
    }, [state, toast, router]);

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/tpas">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New TPA</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>TPA Details</CardTitle>
                    <CardDescription>Fill in the form to add a new Third-Party Administrator.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" placeholder="e.g. HealthServe TPA" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. contact@tpa.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" placeholder="e.g. 888-123-4567" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portalLink">Portal Link</Label>
                                <Input id="portalLink" name="portalLink" type="url" placeholder="https://tpa-portal.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" placeholder="e.g. 123 Health Way, Anytown, USA" />
                        </div>

                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
