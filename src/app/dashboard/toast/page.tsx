
"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormStatus } from "react-dom";
import { handleShowToast } from "./actions";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Showing..." : "Show Toast"}
        </Button>
    );
}

export default function ToastPage() {
    const [state, formAction] = useActionState(handleShowToast, { message: "", type: "initial" });
    const { toast } = useToast();

    useEffect(() => {
        if (state.type === 'success') {
            toast({
                title: "Test Toast",
                description: state.message,
                variant: "success",
            });
        }
    }, [state, toast]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Toast Notification</CardTitle>
                    <CardDescription>Click the button to show a test toast notification.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction}>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
