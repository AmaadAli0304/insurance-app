"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  isCurrency?: boolean;
}

export function StatCard({ title, value, icon: Icon, color, isCurrency = false }: StatCardProps) {
  const formatValue = () => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return value.toLocaleString();
  };

  return (
    <Card className={`${color} text-white`}>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold">{formatValue()}</div>
        <p className="text-sm uppercase tracking-wider">{title}</p>
      </CardContent>
    </Card>
  )
}
