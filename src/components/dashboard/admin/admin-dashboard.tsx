"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building, Factory } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";


export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
       <Card>
          <CardHeader>
            <CardTitle>Welcome, Admin!</CardTitle>
            <CardDescription>Manage hospitals, insurance companies, and system settings from this central hub.</CardDescription>
          </CardHeader>
           <CardContent>
            <p>Use the sidebar navigation to access different sections of the application.</p>
          </CardContent>
        </Card>
    </div>
  )
}
