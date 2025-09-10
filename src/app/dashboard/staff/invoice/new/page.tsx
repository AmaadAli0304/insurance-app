
"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleSaveInvoice, getStaffById } from "../../actions";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Trash2, Send, Download, Save, Loader2 } from "lucide-react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Staff } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useAuth } from "@/components/auth-provider";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
}

function SubmitButton({ status }: { status: 'draft' | 'sent' }) {
    const { pending } = useFormStatus();
    const Icon = status === 'draft' ? Save : Send;
    const text = status === 'draft' ? "Save as Draft" : "Send Invoice";
    const pendingText = status === 'draft' ? "Saving..." : "Sending...";
    
    return (
        <Button type="submit" name="status" value={status} disabled={pending}>
             {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {pendingText}
                </>
             ) : (
                <>
                    <Icon className="mr-2 h-4 w-4" />
                    {text}
                </>
             )}
        </Button>
    );
}

export default function NewInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user: fromUser } = useAuth();
    const staffId = params.id as string;
    
    const [state, formAction] = useActionState(handleSaveInvoice, { message: "", type: 'initial' });
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [items, setItems] = useState<InvoiceItem[]>([{ id: 1, description: '', quantity: 1, rate: 0 }]);
    const [tax, setTax] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (!staffId) return;
        getStaffById(staffId)
            .then(data => {
                if (!data) notFound();
                setStaff(data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [staffId]);

    useEffect(() => {
      const newSubtotal = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
      setSubtotal(newSubtotal);
      const newTotal = newSubtotal * (1 + tax / 100);
      setTotal(newTotal);
    }, [items, tax]);

    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Invoice", description: state.message, variant: "success" });
            router.push('/dashboard/staff');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
    };
    
    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id: number, field: keyof InvoiceItem, value: string | number) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!staff || !fromUser) {
        notFound();
    }
    
    return (
        <form action={formAction}>
            <input type="hidden" name="staffId" value={staff.id} />
            <input type="hidden" name="items" value={JSON.stringify(items.map(({id, ...rest}) => rest))} />
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/staff">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back</span>
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold md:text-2xl">New Invoice</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline"><Download className="mr-2 h-4 w-4" /> Download</Button>
                        <SubmitButton status="draft" />
                        <SubmitButton status="sent" />
                    </div>
                </div>

                <Card className="p-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">{fromUser.name}</h2>
                            <p className="text-muted-foreground">{fromUser.email}</p>
                        </div>
                        <div className="space-y-6 text-left md:text-right">
                             <div className="space-y-2">
                                <Label htmlFor="invoiceNumber" className="text-lg font-semibold">Invoice #</Label>
                                <Input id="invoiceNumber" name="invoiceNumber" defaultValue={`INV-${Date.now()}`} className="md:ml-auto md:w-48 text-right" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="issueDate">Date</Label>
                                    <Input id="issueDate" name="issueDate" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input id="dueDate" name="dueDate" type="date" />
                                </div>
                            </div>
                        </div>
                    </div>

                     <div className="mt-8">
                        <h3 className="font-semibold text-muted-foreground">Bill To</h3>
                        <p className="font-bold">{staff.name}</p>
                        <p>{staff.email}</p>
                    </div>

                    <div className="mt-8">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/2">Item Description</TableHead>
                                    <TableHead className="w-[100px]">Qty</TableHead>
                                    <TableHead className="w-[150px]">Rate</TableHead>
                                    <TableHead className="text-right w-[150px]">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input placeholder="Item name" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" placeholder="1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" placeholder="0.00" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ${(item.quantity * item.rate).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mt-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" name="notes" placeholder="Any additional notes..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="terms">Terms & Conditions</Label>
                                <Textarea id="terms" name="terms" placeholder="Terms of service..." />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span>Tax (%)</span>
                                <Input type="number" name="tax" className="w-24 text-right" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-4">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                     {state.type === 'error' && <p className="text-sm text-destructive mt-4">{state.message}</p>}
                </Card>
            </div>
        </form>
    );
}
