"use client";

import { useState, useEffect, useRef } from "react";
import { getInvoiceById } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, Printer } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";

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
        if (n < 1000) return `${a[Math.floor(n / 100)]} hundred${n % 100 ? ' and ' + inWords(n % 100) : ''}`;
        if (n < 100000) return `${inWords(Math.floor(n / 1000))} thousand${n % 1000 ? ' ' + formatNumber(n % 1000) : ''}`;
        if (n < 10000000) return `${inWords(Math.floor(n / 100000))} lakh${n % 100000 ? ' ' + formatNumber(n % 100000) : ''}`;
        return `${inWords(Math.floor(n / 10000000))} crore${n % 10000000 ? ' ' + formatNumber(n % 10000000) : ''}`;
    };

    if (num === 0) return 'Zero';
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let words = formatNumber(integerPart);
    words = words.charAt(0).toUpperCase() + words.slice(1);

    if (decimalPart > 0) {
        words += ` and ${inWords(decimalPart)} paisa`;
    }

    return `${words} only`;
}

export default function ViewInvoicePage() {
    const params = useParams();
    const { user } = useAuth();
    const id = Number(params.id);
    const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pdfFormRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const headerEl = document.getElementById('pdf-header-container');
        const contentEl = document.getElementById('pdf-content-container');
        const footerEl = document.getElementById('pdf-footer-container');

        if (!contentEl || !invoice) {
            toast({
                title: "Error",
                description: "Cannot download PDF. Invoice content is missing.",
                variant: "destructive"
            });
            return;
        }

        setIsDownloadingPdf(true);
        toast({
            title: "Generating PDF",
            description: "Please wait while the PDF is being created...",
        });

        const hasHeader = invoice.companySettings?.header_img && headerEl;
        const hasFooter = invoice.companySettings?.footer_img && footerEl;

        const contentCanvas = await html2canvas(contentEl, { scale: 2, useCORS: true });
        const headerCanvas = hasHeader ? await html2canvas(headerEl!, { scale: 2, useCORS: true }) : null;
        const footerCanvas = hasFooter ? await html2canvas(footerEl!, { scale: 2, useCORS: true }) : null;

        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 5;
        const usableWidth = pdfWidth - margin * 2;

        const headerHeight = headerCanvas ? (headerCanvas.height * usableWidth) / headerCanvas.width : 0;
        const footerHeight = footerCanvas ? (footerCanvas.height * usableWidth) / footerCanvas.width : 0;

        const contentImgTotalHeight = (contentCanvas.height * usableWidth) / contentCanvas.width;

        // The height available for the content on each page
        const contentAreaHeight = pdfHeight - headerHeight - footerHeight - (margin * 2);

        let contentDrawnInMm = 0;
        let pageCount = 0;

        while (contentDrawnInMm < contentImgTotalHeight) {
            pageCount++;
            if (pageCount > 1) {
                pdf.addPage();
            }

            // 1. Add Header
            if (headerCanvas) {
                const headerImgData = headerCanvas.toDataURL('image/png');
                pdf.addImage(headerImgData, 'PNG', margin, margin, usableWidth, headerHeight);
            }

            // 2. Add Content Slice
            const contentYOnPage = margin + headerHeight;
            const sourceY = (contentDrawnInMm / contentImgTotalHeight) * contentCanvas.height;
            const remainingContentInMm = contentImgTotalHeight - contentDrawnInMm;
            const heightToDrawInMm = Math.min(contentAreaHeight, remainingContentInMm);
            const sourceHeightToCopy = (heightToDrawInMm / contentImgTotalHeight) * contentCanvas.height;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = contentCanvas.width;
            tempCanvas.height = sourceHeightToCopy;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
                tempCtx.drawImage(
                    contentCanvas,
                    0, sourceY,
                    contentCanvas.width, sourceHeightToCopy,
                    0, 0,
                    contentCanvas.width, sourceHeightToCopy
                );
            }

            const pageContentData = tempCanvas.toDataURL('image/png');
            pdf.addImage(pageContentData, 'PNG', margin, contentYOnPage, usableWidth, heightToDrawInMm);

            // 3. Add Footer
            if (footerCanvas) {
                const footerImgData = footerCanvas.toDataURL('image/png');
                pdf.addImage(footerImgData, 'PNG', margin, pdfHeight - footerHeight - margin, usableWidth, footerHeight);
            }

            contentDrawnInMm += heightToDrawInMm;
        }

        pdf.save(`invoice-${invoice.to.replace(/ /g, '_')}-${invoice.id}.pdf`);
        setIsDownloadingPdf(false);
    };

    const subtotal = invoice?.items.reduce((acc, item) => acc + item.amount, 0) ?? 0;
    const taxRate = 9; // 9% for CGST and SGST
    const cgstAmount = subtotal * (taxRate / 100);
    const sgstAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + cgstAmount + sgstAmount;

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!invoice) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
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
                    <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    <Button onClick={handleDownloadPdf} variant="outline" disabled={isDownloadingPdf}>
                        {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isDownloadingPdf ? 'Downloading...' : 'Download as PDF'}
                    </Button>
                    <Button asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>Edit Invoice</Link>
                    </Button>
                </div>
            </div>
            <div id="printable-invoice" ref={pdfFormRef} className="bg-white p-4">
                <div id="pdf-header-container">
                    {invoice.companySettings?.header_img && (
                        <img 
                            src={invoice.companySettings.header_img} 
                            alt="Invoice Header" 
                            className="w-full h-auto max-h-36 object-contain" 
                            crossOrigin="anonymous"
                        />
                    )}
                </div>
                <div id="pdf-content-container">
                    <div className="border-2 border-black">
                        <div className="bg-yellow-400 text-black text-center py-2">
                            <h1 className="text-2xl font-bold">INVOICE</h1>
                        </div>
                        <div className="grid grid-cols-2 p-4 border-b-2 border-black">
                            <div className="space-y-1">
                                <p><strong>Company Name:</strong> {invoice.companySettings?.name || 'N/A'}</p>
                                <p><strong>Address:</strong> {invoice.companySettings?.address || 'N/A'}</p>
                                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                                <p><strong>GST No:</strong> {invoice.companySettings?.gst_no || 'N/A'}</p>
                                <p><strong>PAN no:</strong> {invoice.companySettings?.pan_no || 'N/A'}</p>
                            </div>
                            <div className="flex justify-end items-start">
                                <Logo />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 p-4 border-b-2 border-black">
                            <div className="space-y-1">
                                <p><strong>Billing To:</strong> {invoice.to}</p>
                                <p><strong>Name:</strong> {invoice.hospitalContactPerson || 'N/A'}</p>
                                <p><strong>Address:</strong> {invoice.hospitalAddress || 'N/A'}</p>
                                <p><strong>Mobile:</strong> {invoice.hospitalPhone || 'N/A'}</p>
                                <p><strong>Email ID:</strong> {invoice.hospitalEmail || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p><strong>Invoice No:</strong> INV-{String(invoice.id).padStart(4, '0')}</p>
                                <p><strong>Invoice Date:</strong> {format(new Date(invoice.created_at), 'dd-MMM-yyyy')}</p>
                                <p><strong>PAN No:</strong> {invoice.companySettings?.pan_no || 'N/A'}</p>
                                <p><strong>Payment Mode:</strong> ONLINE/CHQ</p>
                            </div>
                        </div>
                        <div>
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="border-b-2 border-black">
                                        <TableHead className="w-[80px] border-r-2 border-black text-black font-bold">Sr No</TableHead>
                                        <TableHead className="text-black font-bold">Description</TableHead>
                                        <TableHead className="text-right text-black font-bold">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map((item, index) => (
                                        <TableRow key={item.id} className="border-b-2 border-black">
                                            <TableCell className="border-r-2 border-black text-center">{index + 1}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right font-mono">{item.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={2} className="pt-4 align-top">
                                            <div className="text-xs space-y-1">
                                                <p className="font-bold underline">Terms &amp; Conditions:</p>
                                                <ol className="list-decimal list-inside">
                                                </ol>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-0">
                                            <Table className="w-full">
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="text-right font-bold border-t-2 border-black">Sub Total</TableCell>
                                                        <TableCell className="text-right font-mono border-t-2 border-black">{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="text-right font-bold">CGST 9%</TableCell>
                                                        <TableCell className="text-right font-mono">{cgstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="text-right font-bold">SGST 9%</TableCell>
                                                        <TableCell className="text-right font-mono">{sgstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="text-right font-bold">Balance Received</TableCell>
                                                        <TableCell className="text-right font-mono">0.00</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="text-right font-bold">Balance Due</TableCell>
                                                        <TableCell className="text-right font-mono">{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="border-t-2 border-black bg-yellow-400">
                                        <TableHead colSpan={2} className="text-right text-black font-bold">Total</TableHead>
                                        <TableHead className="text-right text-black font-bold font-mono">{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableHead>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        <div className="p-4 space-y-1">
                            <p><strong>Amount in Words:</strong> {numberToWords(grandTotal)}</p>
                            <p><strong>Amount to be credited:</strong></p>
                            <p><strong>Account Name:</strong> {invoice.companySettings?.account_name || 'N/A'}</p>
                            <p><strong>Banking Details:</strong></p>
                            <p><strong>Bank Name:</strong> {invoice.companySettings?.bank_name || 'N/A'}</p>
                            <p><strong>Branch:</strong> {invoice.companySettings?.branch || 'N/A'}</p>
                            <p><strong>Account No:</strong> {invoice.companySettings?.account_no || 'N/A'}</p>
                            <p><strong>IFSC Code:</strong> {invoice.companySettings?.ifsc_code || 'N/A'}</p>
                            <p><strong>Contact No:</strong> {invoice.companySettings?.contact_no || 'N/A'}</p>
                            <p>Attached PT List</p>
                        </div>
                    </div>
                </div>
                <div id="pdf-footer-container">
                    {invoice.companySettings?.footer_img && (
                        <img 
                            src={invoice.companySettings.footer_img} 
                            alt="Invoice Footer" 
                            className="w-full h-auto max-h-36 object-contain" 
                            crossOrigin="anonymous"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
