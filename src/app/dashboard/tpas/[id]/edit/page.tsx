
"use client";

import * as React from "react";
import { useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateTPA, getTPAById } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import type { TPA } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditTPAPage({ params }: { params: { id: string } }) {
    const [tpa, setTpa] = React.useState<TPA | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateTPA, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchTpa() {
            try {
                const tpaId = Number(params.id);
                if (isNaN(tpaId)) {
                    notFound();
                    return;
                }
                const fetchedTpa = await getTPAById(tpaId);
                if (!fetchedTpa) {
                    notFound();
                    return;
                }
                setTpa(fetchedTpa);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTpa();
    }, [params.id]);

    useEffect(() => {
        if (state.type === 'success') {
           toast({
             title: "TPA",
             description: "TPA updated successfully",
             variant: "success",
           });
           router.push('/dashboard/tpas');
        } else if (state.type === 'error') {
           toast({
             title: "Error",
             description: state.message,
             variant: "destructive",
           });
        }
    }, [state, router, toast]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!tpa) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/tpas">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit TPA: {tpa.name}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update TPA Details</CardTitle>
                    <CardDescription>Modify the form to update the TPA's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={tpa.id} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">TPA Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={tpa.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={tpa.email ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={tpa.phone ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="portalLink">Portal Link</Label>
                                <Input id="portalLink" name="portalLink" type="url" defaultValue={tpa.portalLink ?? ""} placeholder="https://tpa-portal.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" defaultValue={tpa.address ?? ""} />
                        </div>
                        
                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
