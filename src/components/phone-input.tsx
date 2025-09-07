
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

const getNumericCode = (code: string) => code.split('-')[0];

const parsePhoneNumber = (fullNumber: string) => {
    const sortedCountries = [...countries].sort((a, b) => getNumericCode(b.code).length - getNumericCode(a.code).length);
    const foundCountry = sortedCountries.find(c => fullNumber.startsWith(getNumericCode(c.code)));
    
    if (foundCountry) {
        const numericCode = getNumericCode(foundCountry.code);
        return {
            code: foundCountry.code,
            number: fullNumber.substring(numericCode.length)
        };
    }
    // Default to India if no country code matches or if number is empty
    return { code: "+91", number: fullNumber.replace(/^\+91/, '') };
};


const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ name, defaultValue = "", value, className, onChange, ...props }, ref) => {
  
  const initial = parsePhoneNumber(value ?? defaultValue);
  const [countryCode, setCountryCode] = React.useState(initial.code);
  const [number, setNumber] = React.useState(initial.number);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (value !== undefined) {
      const parsed = parsePhoneNumber(value);
      setCountryCode(parsed.code);
      setNumber(parsed.number);
    }
  }, [value]);

  const getCountryInfo = (code: string) => {
    return countries.find(c => c.code === code);
  }

  const validatePhoneNumber = (code: string, num: string) => {
      const countryInfo = getCountryInfo(code);
      if (countryInfo?.iso === "IN" && num && num.length !== 10) {
        setError("Indian phone numbers must be 10 digits.");
      } else {
        setError(null);
      }
    };

  const formatPhoneNumber = (code: string, num: string): string => {
    const countryInfo = getCountryInfo(code);
    if (countryInfo?.iso === "IN") {
       const match = num.match(/^(\d{0,2})(\d{0,4})(\d{0,4})$/);
        if (match) {
            return [match[1], match[2], match[3]].filter(Boolean).join(' ');
        }
    }
    return num;
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const cleanedNumber = number.replace(/\s/g, '');
    validatePhoneNumber(code, cleanedNumber);
    if (onChange) {
        onChange(`${getNumericCode(code)}${cleanedNumber}`);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const countryInfo = getCountryInfo(countryCode);
    let newNumber = e.target.value.replace(/\D/g, ''); // Only allow digits

    if(countryInfo?.length && newNumber.length > countryInfo.length) {
        newNumber = newNumber.slice(0, countryInfo.length);
    }
    
    setNumber(newNumber);
    validatePhoneNumber(countryCode, newNumber);
    if (onChange) {
        onChange(`${getNumericCode(countryCode)}${newNumber}`);
    }
  };
  
  const getCountryIsoCode = (code: string) => {
    return countries.find(c => c.code === code)?.iso.toLowerCase() || 'in';
  }
  
  const countryInfo = getCountryInfo(countryCode);

  return (
    <div>
        <div className={cn("flex items-center group", className)}>
            <input type="hidden" name={name} value={`${getNumericCode(countryCode)}${number}`} />
            <Select value={countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[120px] rounded-r-none focus:ring-0 border-r-0 group-focus-within:border-ring group-focus-within:ring-2 group-focus-within:ring-ring group-focus-within:ring-offset-2">
                <SelectValue placeholder="Code">
                    <span className="flex items-center gap-2">
                        <Image src={`https://flagcdn.com/16x12/${getCountryIsoCode(countryCode)}.png`} width={16} height={12} alt="Country Flag" />
                        {getNumericCode(countryCode)}
                    </span>
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {countries.map((country) => (
                        <SelectItem key={country.iso} value={country.code}>
                            <span className="flex items-center gap-2">
                                <Image src={`https://flagcdn.com/16x12/${country.iso.toLowerCase()}.png`} width={16} height={12} alt={`${country.name} Flag`} />
                                {country.name} ({getNumericCode(country.code)})
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="tel"
                value={formatPhoneNumber(countryCode, number)}
                onChange={handleNumberChange}
                className="rounded-l-none"
                placeholder={countryInfo?.iso === 'IN' ? 'XX XXXX XXXX' : 'Enter phone number'}
                maxLength={countryInfo?.iso === 'IN' ? 12 : countryInfo?.length ? countryInfo.length + Math.floor((countryInfo.length - 1) / 4) : undefined}
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
