
"use client";

import { useState, useEffect, useRef } from "react";
import { getInvoiceById } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

// Function to convert number to words
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

export default function ViewInvoicePage() {
    const params = useParams();
    const id = Number(params.id);
    const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pdfFormRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isNaN(id)) {
            notFound();
            return;
        }
        getInvoiceById(id).then(data => {
            if (!data) notFound();
            setInvoice(data);
            setIsLoading(false);
        });
    }, [id]);

    const handleDownloadPdf = async () => {
        const formToCapture = pdfFormRef.current;
        if (!formToCapture || !invoice) {
            toast({
                title: "Error",
                description: "Cannot download PDF. Invoice data is missing.",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Generating PDF",
            description: "Please wait while the PDF is being created...",
        });

        const canvas = await html2canvas(formToCapture, {
            scale: 2, 
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const height = pdfWidth / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
        pdf.save(`invoice-${invoice.to.replace(/ /g, '_')}-${invoice.id}.pdf`);
    };

    const subtotal = invoice?.items.reduce((acc, item) => acc + item.amount, 0) ?? 0;
    const taxRate = 18;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!invoice) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/invoices">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Invoice Details</h1>
                        <p className="text-sm text-muted-foreground">Viewing Invoice INV-{String(invoice.id).padStart(4, '0')}</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <Button onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download as PDF</Button>
                    <Button asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>Edit Invoice</Link>
                    </Button>
                </div>
            </div>
            <div ref={pdfFormRef}>
                <Card className="p-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">{invoice.staffName || "Staff"}</h2>
                            <div className="grid grid-cols-2 gap-y-1 text-sm">
                                <span className="font-semibold">Bank:</span><span>{invoice.bank_name}</span>
                                <span className="font-semibold">Account Name:</span><span>{invoice.account_name}</span>
                                <span className="font-semibold">Account No:</span><span>{invoice.account_number}</span>
                                <span className="font-semibold">IFSC:</span><span>{invoice.ifsc_code}</span>
                                <span className="font-semibold">Branch:</span><span>{invoice.branch}</span>
                            </div>
                        </div>
                        <div className="space-y-6 text-left md:text-right">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-muted-foreground">Billed To</h3>
                                <p className="font-bold">{invoice.to}</p>
                                <p className="text-muted-foreground">{invoice.address}</p>
                            </div>
                            <div className="space-y-1">
                                <p><span className="font-semibold text-muted-foreground">Invoice Date:</span> {format(new Date(invoice.created_at), 'MMMM dd, yyyy')}</p>
                                <p><span className="font-semibold text-muted-foreground">Billing Period:</span> {invoice.period}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <p><strong className="text-muted-foreground">Service Provided:</strong> {invoice.service_provided}</p>
                    </div>

                    <div className="mt-8">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/2">Description</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Rate (₹)</TableHead>
                                    <TableHead className="text-right">Amount (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-center">{item.qty}</TableCell>
                                        <TableCell className="text-right">{item.rate.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-medium">{item.amount.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mt-8">
                        <div className="space-y-4"></div>
                        <div className="space-y-2">
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span>GST @ {taxRate}%</span><span>₹{taxAmount.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Grand Total</span><span>₹{grandTotal.toLocaleString('en-IN')}</span></div>
                            <div className="text-sm text-muted-foreground pt-2"><strong>In Words:</strong> {numberToWords(grandTotal)}</div>
                        </div>
                    </div>

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
        </div>
    );
}
