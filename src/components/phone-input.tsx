
"use client";

import * as React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/countries";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue' | 'value' | 'onChange'> {
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ name, defaultValue = "", value, className, onChange, ...props }, ref) => {
  
  const getInitialValues = (initialValue: string) => {
    const foundCountry = countries.find(c => initialValue.startsWith(c.code));
    if (foundCountry) {
      return {
        code: foundCountry.code,
        number: initialValue.substring(foundCountry.code.length)
      };
    }
    // Default to India if no match
    return { code: "+91", number: initialValue };
  };

  const initial = getInitialValues(defaultValue || value || "");
  const [countryCode, setCountryCode] = React.useState(initial.code);
  const [number, setNumber] = React.useState(initial.number);
  const [error, setError] = React.useState<string | null>(null);

  const validatePhoneNumber = (code: string, num: string) => {
      if (code === "+91" && num && num.length !== 10) {
        setError("Indian phone numbers must be 10 digits.");
      } else {
        setError(null);
      }
    };


  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    validatePhoneNumber(code, number);
    onChange?.(`${code}${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\D/g, ''); // Only allow digits
    setNumber(newNumber);
    validatePhoneNumber(countryCode, newNumber);
    onChange?.(`${countryCode}${newNumber}`);
  };
  
  const getCountryIsoCode = (code: string) => {
    return countries.find(c => c.code === code)?.iso.toLowerCase() || 'in';
  }

  return (
    <div>
        <div className={cn("flex items-center group", className)}>
            <input type="hidden" name={name} value={`${countryCode}${number}`} />
            <Select value={countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[120px] rounded-r-none focus:ring-0 border-r-0 group-focus-within:border-ring group-focus-within:ring-2 group-focus-within:ring-ring group-focus-within:ring-offset-2">
                <SelectValue placeholder="Code">
                    <span className="flex items-center gap-2">
                        <Image src={`https://flagcdn.com/16x12/${getCountryIsoCode(countryCode)}.png`} width={16} height={12} alt="Country Flag" />
                        {countryCode}
                    </span>
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {countries.map((country) => (
                        <SelectItem key={country.iso} value={country.code}>
                            <span className="flex items-center gap-2">
                                <Image src={`https://flagcdn.com/16x12/${country.iso.toLowerCase()}.png`} width={16} height={12} alt={`${country.name} Flag`} />
                                {country.name} ({country.code})
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="tel"
                value={number}
                onChange={handleNumberChange}
                className="rounded-l-none"
                placeholder="9876543210"
                ref={ref}
                {...props}
            />
        </div>
         {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
});

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };

