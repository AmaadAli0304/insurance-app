
"use client";

import * as React from "react";
import { useActionState, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleSaveInvoice, getSettledFinalBillSum } from "../actions";
import { getHospitals } from "@/app/dashboard/company-hospitals/actions";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Trash2, Send, Save, Loader2, CalendarIcon } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Hospital } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  id: number;
  description: string;
  qty: string;
  rate: string;
  amount: number;
}

function SubmitButton({ status }: { status: 'draft' | 'sent' }) {
    const { pending } = useFormStatus();
    const isDraft = status === 'draft';
    const Icon = isDraft ? Save : Send;
    const text = isDraft ? "Save as Draft" : "Create Invoice";
    const pendingText = "Saving...";

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

// Function to convert number to words
function numberToWords(num: number): string {
    const a = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const b = [
        '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];

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
    const decimals = Math.round((num % 1) * 100);
    const finalWords = `${words.charAt(0).toUpperCase() + words.slice(1)} only`;
    
    return finalWords;
}


export default function NewInvoicePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user: fromUser } = useAuth();
    
    const [state, formAction] = useActionState(handleSaveInvoice, { message: "", type: 'initial' });
    const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name' | 'address'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [contractType, setContractType] = useState<string | undefined>();

    const [items, setItems] = useState<InvoiceItem[]>([{ id: 1, description: 'Service Charges', qty: "1", rate: '0', amount: 0 }]);
    const [taxRate] = useState(18);

    const [subtotal, setSubtotal] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [billingPeriod, setBillingPeriod] = useState<Date | undefined>(new Date());
    
    const [baseAmount, setBaseAmount] = useState(0);
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        async function loadData() {
            try {
                const hospitalList = await getHospitals();
                setHospitals(hospitalList);
            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Failed to load necessary data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [toast]);
    
    useEffect(() => {
      const newSubtotal = items.reduce((acc, item) => acc + item.amount, 0);
      setSubtotal(newSubtotal);
      const newTaxAmount = newSubtotal * (taxRate / 100);
      setTaxAmount(newTaxAmount);
      const newGrandTotal = newSubtotal + newTaxAmount;
      setGrandTotal(newGrandTotal);
    }, [items, taxRate]);

    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Invoice", description: state.message, variant: "success" });
            router.push('/dashboard/invoices');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);
    
    useEffect(() => {
        if (contractType === 'Percentage' && selectedHospitalId) {
            getSettledFinalBillSum(selectedHospitalId).then(setBaseAmount);
        } else {
            setBaseAmount(0);
        }
    }, [contractType, selectedHospitalId]);

    useEffect(() => {
        if (contractType === 'Percentage') {
            const calculatedAmount = baseAmount * (percentage / 100);
            const updatedItems = [{ ...items[0], rate: String(calculatedAmount), qty: String(percentage || 0), amount: calculatedAmount }];
            setItems(updatedItems);
        } else {
             const updatedItems = [{ ...items[0], rate: '0', qty: '1', amount: 0 }];
             setItems(updatedItems);
        }
    }, [baseAmount, percentage, contractType]);


    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), description: '', qty: "1", rate: '0', amount: 0 }]);
    };
    
    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id: number, field: keyof Omit<InvoiceItem, 'id'|'amount'>, value: string) => {
      setItems(items.map(item => {
          if (item.id === id) {
              const updatedItem = { ...item, [field]: value };
              const qty = parseFloat(updatedItem.qty) || 0;
              const rate = parseFloat(updatedItem.rate) || 0;
              updatedItem.amount = qty * rate;
              return updatedItem;
          }
          return item;
      }));
    };
    
    const handleRateBlur = (id: number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const rateAsNumber = parseFloat(item.rate);
                return { ...item, rate: isNaN(rateAsNumber) ? '0' : item.rate };
            }
            return item;
        }));
    };


    const selectedHospital = hospitals.find(s => s.id === selectedHospitalId);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!fromUser) {
        notFound();
    }
    
    return (
        <form action={formAction}>
            <input type="hidden" name="staffId" value={fromUser.uid} />
            <input type="hidden" name="hospitalId" value={selectedHospitalId} />
             <input type="hidden" name="items" value={JSON.stringify(items.map(({ id, ...rest }) => rest))} />
             <input type="hidden" name="tax" value={taxRate} />
             <input type="hidden" name="period" value={billingPeriod ? format(billingPeriod, "MMMM yyyy") : ""} />
             <input type="hidden" name="percentage" value={percentage} />

            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/invoices">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back</span>
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold md:text-2xl">New Invoice</h1>
                    </div>
                    <div className="flex gap-2">
                        <SubmitButton status="sent" />
                    </div>
                </div>

                <Card className="p-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Bank Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Input name="bank_name" placeholder="Bank Name" />
                                <Input name="account_name" placeholder="Account Name" />
                                <Input name="account_number" placeholder="Account Number" />
                                <Input name="ifsc_code" placeholder="IFSC Code" />
                                <Input name="branch" placeholder="Branch" />
                            </div>
                        </div>
                        <div className="space-y-6 text-left md:text-right">
                             <div className="space-y-2">
                                <h3 className="font-semibold text-muted-foreground">Bill To</h3>
                                <Select onValueChange={setSelectedHospitalId} required>
                                    <SelectTrigger className="md:ml-auto md:w-48 text-right">
                                        <SelectValue placeholder="Select Hospital" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hospitals.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="to" value={selectedHospital?.name ?? ''} />
                                <Textarea name="address" placeholder="Client Address" className="md:ml-auto md:w-48 text-right" />
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
                                <Select name="contract_type" onValueChange={setContractType}>
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
                            {contractType === 'Percentage' && (
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="baseAmount" className="font-semibold text-muted-foreground">Settled Amount</Label>
                                        <Input id="baseAmount" value={baseAmount.toLocaleString('en-IN')} readOnly className="md:ml-auto md:w-48 text-right font-bold bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                         <Label htmlFor="percentage" className="font-semibold text-muted-foreground">Percentage</Label>
                                         <Select onValueChange={(val) => setPercentage(Number(val))}>
                                            <SelectTrigger className="md:ml-auto md:w-48 text-right">
                                                <SelectValue placeholder="Select %" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({length: 10}, (_, i) => i + 1).map(p => (
                                                    <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <Label htmlFor="service_provided">Service Provided</Label>
                        <Textarea id="service_provided" name="service_provided" placeholder="Describe the service provided..." />
                    </div>

                    <div className="mt-8">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/2">Description</TableHead>
                                    {contractType !== 'Percentage' && <TableHead className="w-[100px]">Qty</TableHead>}
                                    {contractType !== 'Percentage' && <TableHead className="w-[150px]">Rate</TableHead>}
                                    <TableHead className="text-right w-[150px]">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input placeholder="Item name" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                                        </TableCell>
                                        {contractType !== 'Percentage' ? (
                                            <>
                                                <TableCell>
                                                    <Input placeholder="1" type="text" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input placeholder="0.00" type="text" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} onBlur={() => handleRateBlur(item.id)} />
                                                </TableCell>
                                            </>
                                        ) : null}
                                        <TableCell className="text-right font-medium">
                                            {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                         {contractType !== 'Percentage' && 
                             <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Charges
                            </Button>
                         }
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mt-8">
                        <div className="space-y-4">
                           {/* Empty column for alignment */}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST @ {taxRate}%</span>
                                <span>{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Grand Total (Billed)</span>
                                <span>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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


    

    