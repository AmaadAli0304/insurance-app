
"use client";

import * as React from "react";
import { useActionState, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleUpdateInvoice, getInvoiceById } from "../../actions";
import { getHospitals } from "@/app/dashboard/company-hospitals/actions";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Trash2, Save, Loader2, CalendarIcon } from "lucide-react";
import { notFound, useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Hospital, Invoice, InvoiceItem } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EditInvoiceItem extends Omit<InvoiceItem, 'rate'> {
  _id: number; // For temporary client-side unique key
  rate: number | string;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="status" value="sent" disabled={pending}>
             {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
             ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </>
             )}
        </Button>
    );
}

// Function to convert number to words (as in new/page.tsx)
function numberToWords(num: number): string {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const inWords = (n: number): string => {
        if (n < 20) return a[n];
        let digit = n % 10;
        return `${b[Math.floor(n / 10)]}${digit ? ' ' + a[digit] : ''}`;
    };

    const formatNumber = (n: number): string => {
        if (n < 100) return inWords(n);
        if (n < 1000) return `${a[Math.floor(n / 100)]} hundred${n % 100 ? ' ' + inWords(n % 100) : ''}`;
        if (n < 100000) return `${inWords(Math.floor(n / 1000))} thousand${n % 1000 ? ' ' + formatNumber(n % 1000) : ''}`;
        if (n < 10000000) return `${inWords(Math.floor(n / 100000))} lakh${n % 100000 ? ' ' + formatNumber(n % 100000) : ''}`;
        return `${inWords(Math.floor(n / 10000000))} crore${n % 10000000 ? ' ' + formatNumber(n % 10000000) : ''}`;
    };

    if (num === 0) return 'zero';
    const words = formatNumber(Math.floor(num));
    return `${words.charAt(0).toUpperCase() + words.slice(1)} only`;
}

export default function EditInvoicePage() {
    const params = useParams();
    const id = Number(params.id);
    const router = useRouter();
    const { toast } = useToast();
    const { user: fromUser } = useAuth();
    
    const [state, formAction] = useActionState(handleUpdateInvoice, { message: "", type: 'initial' });
    const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name' | 'address'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [items, setItems] = useState<EditInvoiceItem[]>([]);
    const [taxRate] = useState(18);

    const [subtotal, setSubtotal] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [billingPeriod, setBillingPeriod] = useState<Date | undefined>();

    const calculateAmount = React.useCallback((item: EditInvoiceItem) => {
        const { qty, rate } = item;
        const numQuantity = Number(qty);
        const numRate = Number(rate);
        if (isNaN(numQuantity) || isNaN(numRate)) return 0;
        return numQuantity * numRate;
    }, []);

    useEffect(() => {
        if (isNaN(id)) {
            notFound();
            return;
        }

        async function loadData() {
            try {
                const [invoiceData, hospitalList] = await Promise.all([
                    getInvoiceById(id),
                    getHospitals()
                ]);

                if (!invoiceData) {
                    notFound();
                    return;
                }

                setInvoice(invoiceData);
                setHospitals(hospitalList);
                setItems(invoiceData.items.map(item => ({ ...item, _id: Math.random() })));
                setBillingPeriod(invoiceData.period ? new Date(invoiceData.period) : new Date());
            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Failed to load invoice data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id, toast]);
    
    useEffect(() => {
        const newSubtotal = items.reduce((acc, item) => acc + calculateAmount(item), 0);
        setSubtotal(newSubtotal);
        const newTaxAmount = newSubtotal * (taxRate / 100);
        setTaxAmount(newTaxAmount);
        const newGrandTotal = newSubtotal + newTaxAmount;
        setGrandTotal(newGrandTotal);
    }, [items, taxRate, calculateAmount]);

    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Invoice", description: state.message, variant: "success" });
            router.push('/dashboard/invoices');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);

    const handleAddItem = () => {
        setItems([...items, { id: 0, invoice_id: id, description: '', qty: 1, rate: 0, amount: 0, _id: Math.random() }]);
    };
    
    const handleRemoveItem = (_id: number) => {
        setItems(items.filter(item => item._id !== _id));
    };

    const handleItemChange = (_id: number, field: keyof Omit<EditInvoiceItem, '_id' | 'id' | 'invoice_id' | 'amount'>, value: string) => {
        setItems(items.map(item => {
            if (item._id === _id) {
                 if (field === 'description') {
                    return { ...item, [field]: value };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    if (isLoading || !invoice) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={invoice.id} />
            <input type="hidden" name="staffId" value={fromUser?.uid ?? invoice.staff_id} />
            <input type="hidden" name="hospitalId" value={invoice.hospital} />
             <input type="hidden" name="items" value={JSON.stringify(items.map(({ _id, id, invoice_id, ...rest }) => ({
                ...rest,
                rate: Number(rest.rate) || 0,
                total: (Number(rest.qty) || 0) * (Number(rest.rate) || 0),
                amount: (Number(rest.qty) || 0) * (Number(rest.rate) || 0),
            })))} />
             <input type="hidden" name="tax" value={taxRate} />
             <input type="hidden" name="period" value={billingPeriod ? format(billingPeriod, "MMMM yyyy") : ""} />

            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/invoices">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back</span>
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold md:text-2xl">Edit Invoice INV-{String(invoice.id).padStart(4, '0')}</h1>
                    </div>
                    <div className="flex gap-2">
                        <SubmitButton />
                    </div>
                </div>

                <Card className="p-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Bank Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Input name="bank_name" placeholder="Bank Name" defaultValue={invoice.bank_name} />
                                <Input name="account_name" placeholder="Account Name" defaultValue={invoice.account_name} />
                                <Input name="account_number" placeholder="Account Number" defaultValue={invoice.account_number} />
                                <Input name="ifsc_code" placeholder="IFSC Code" defaultValue={invoice.ifsc_code} />
                                <Input name="branch" placeholder="Branch" defaultValue={invoice.branch} />
                            </div>
                        </div>
                        <div className="space-y-6 text-left md:text-right">
                             <div className="space-y-2">
                                <h3 className="font-semibold text-muted-foreground">Bill To</h3>
                                <Input name="to" value={invoice.to} readOnly className="md:ml-auto md:w-48 text-right font-bold" />
                                <Textarea name="address" placeholder="Client Address" className="md:ml-auto md:w-48 text-right" defaultValue={invoice.address} />
                            </div>
                            <div className="space-y-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "md:ml-auto md:w-48 justify-start text-left font-normal",
                                                !billingPeriod && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {billingPeriod ? format(billingPeriod, "MMMM yyyy") : <span>Pick a month</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={billingPeriod}
                                            onSelect={setBillingPeriod}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Select name="contract_type" defaultValue={invoice.contract_type}>
                                    <SelectTrigger className="md:ml-auto md:w-48 text-right">
                                        <SelectValue placeholder="Contract Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                        <SelectItem value="Percentage">Percentage</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Label htmlFor="service_provided">Service Provided</Label>
                        <Textarea id="service_provided" name="service_provided" placeholder="Describe the service provided..." defaultValue={invoice.service_provided} />
                    </div>

                    <div className="mt-8">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/2">Description</TableHead>
                                    <TableHead className="w-[100px]">Qty</TableHead>
                                    <TableHead className="w-[150px]">Rate (Rs)</TableHead>
                                    <TableHead className="text-right w-[150px]">Amount (Rs)</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell>
                                            <Input placeholder="Item name" value={item.description} onChange={(e) => handleItemChange(item._id, 'description', e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <Input placeholder="1" type="number" value={item.qty} onChange={(e) => handleItemChange(item._id, 'qty', e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <Input placeholder="0.00" type="number" step="0.01" value={item.rate} onChange={(e) => handleItemChange(item._id, 'rate', e.target.value)} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            Rs {calculateAmount(item).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item._id)} className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Charges
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mt-8">
                        <div className="space-y-4">
                           {/* Empty column for alignment */}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>Rs {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST @ {taxRate}%</span>
                                <span>Rs {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Grand Total (Billed)</span>
                                <span>Rs {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-sm text-muted-foreground pt-2">
                                <strong>In Words:</strong> {numberToWords(grandTotal)}
                            </div>
                        </div>
                    </div>
                     {state.type === 'error' && <p className="text-sm text-destructive mt-4">{state.message}</p>}

                    <div className="mt-12 pt-8 border-t">
                        <h4 className="font-semibold mb-2">Declaration</h4>
                        <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                            <li>We declare that the information given above is true and correct.</li>
                            <li>Please Pay Cheque/Draft in favour of Global Communication</li>
                            <li>Price And Validity Will Be Revised As Per Market Rule and Regulation</li>
                            <li>(This is a Computer Generated Invoice)</li>
                        </ol>
                    </div>
                </Card>
            </div>
        </form>
    );
}
