"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getInvoices } from "./actions";
import { InvoicesTable } from "./invoices-table";
import type { Invoice } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const invoiceData = await getInvoices();
      setInvoices(invoiceData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);
  

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Manage all generated invoices.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
             <Link href="/dashboard/invoices/new">
                <PlusCircle className="h-4 w-4" />
                Add Invoice
             </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading invoices...</p>
          ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Invoices</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
           ) : (
            <InvoicesTable invoices={invoices} onInvoiceDeleted={loadInvoices} />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
