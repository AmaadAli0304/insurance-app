
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getTPAs } from "./actions"
import { TPAsTable } from "./tpas-table"
import type { TPA } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TPAsPage() {
  const [tpas, setTpas] = useState<TPA[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTPAs = useCallback(async () => {
    setIsLoading(true);
    try {
      const tpaData = await getTPAs();
      setTpas(tpaData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTPAs();
  }, [loadTPAs]);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Third-Party Administrators (TPAs)</CardTitle>
            <CardDescription>Manage TPA profiles and their associated entities.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/tpas/new">
              <PlusCircle className="h-4 w-4" />
              Add TPA
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading TPAs...</p>
          ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching TPAs</AlertTitle>
                <AlertDescription>
                  {error}
                  <p className="mt-2 text-xs">Please ensure your database is running and the connection details are correct.</p>
                </AlertDescription>
              </Alert>
           ) : (
            <TPAsTable tpas={tpas} onTPADeleted={loadTPAs} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
