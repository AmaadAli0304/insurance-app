
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormStatus } from "react-dom";
import { handleCheckConnection } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Checking..." : "Check Connection & Setup Tables"}
        </Button>
    );
}

export default function CheckConnectionPage() {
    const [state, formAction] = useActionState(handleCheckConnection, { message: "", variant: null });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Database Health Check</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Database Connection</CardTitle>
                    <CardDescription>Click the button below to verify the connection to your MSSQL database and ensure the necessary tables are created and seeded.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={formAction}>
                        <SubmitButton />
                    </form>
                     {state.message && (
                        <Alert variant={state.variant || 'default'}>
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>{state.variant === 'destructive' ? 'Error' : 'Success'}</AlertTitle>
                            <AlertDescription>
                               {state.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
