
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
  name: string;
  defaultValue?: string;
}

export function PhoneInput({ name, defaultValue = "", className, ...props }: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState("+91");
  const [number, setNumber] = React.useState(defaultValue);

  const fullNumber = `${countryCode}${number}`;

  return (
    <div className={cn("flex items-center", className)}>
      <input type="hidden" name={name} value={fullNumber} />
      <Select value={countryCode} onValueChange={setCountryCode}>
        <SelectTrigger className="w-[80px] rounded-r-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="+91">IN</SelectItem>
          <SelectItem value="+1">US</SelectItem>
          <SelectItem value="+44">UK</SelectItem>
          <SelectItem value="+61">AU</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="rounded-l-none"
        placeholder="9876543210"
        maxLength={10}
        {...props}
      />
    </div>
  );
}

    