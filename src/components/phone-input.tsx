
"use client";

import * as React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
  name: string;
  defaultValue?: string;
}

const countries = [
    { code: "+93", name: "AF" },
    { code: "+355", name: "AL" },
    { code: "+213", name: "DZ" },
    { code: "+1-684", name: "AS" },
    { code: "+376", name: "AD" },
    { code: "+244", name: "AO" },
    { code: "+1-264", name: "AI" },
    { code: "+672", name: "AQ" },
    { code: "+1-268", name: "AG" },
    { code: "+54", name: "AR" },
    { code: "+374", name: "AM" },
    { code: "+297", name: "AW" },
    { code: "+61", name: "AU" },
    { code: "+43", name: "AT" },
    { code: "+994", name: "AZ" },
    { code: "+1-242", name: "BS" },
    { code: "+973", name: "BH" },
    { code: "+880", name: "BD" },
    { code: "+1-246", name: "BB" },
    { code: "+375", name: "BY" },
    { code: "+32", name: "BE" },
    { code: "+501", name: "BZ" },
    { code: "+229", name: "BJ" },
    { code: "+1-441", name: "BM" },
    { code: "+975", name: "BT" },
    { code: "+591", name: "BO" },
    { code: "+387", name: "BA" },
    { code: "+267", name: "BW" },
    { code: "+55", name: "BR" },
    { code: "+246", name: "IO" },
    { code: "+1-284", name: "VG" },
    { code: "+673", name: "BN" },
    { code: "+359", name: "BG" },
    { code: "+226", name: "BF" },
    { code: "+257", name: "BI" },
    { code: "+855", name: "KH" },
    { code: "+237", name: "CM" },
    { code: "+1", name: "CA" },
    { code: "+238", name: "CV" },
    { code: "+1-345", name: "KY" },
    { code: "+236", name: "CF" },
    { code: "+235", name: "TD" },
    { code: "+56", name: "CL" },
    { code: "+86", name: "CN" },
    { code: "+61", name: "CX" },
    { code: "+61", name: "CC" },
    { code: "+57", name: "CO" },
    { code: "+269", name: "KM" },
    { code: "+682", name: "CK" },
    { code: "+506", name: "CR" },
    { code: "+385", name: "HR" },
    { code: "+53", name: "CU" },
    { code: "+599", name: "CW" },
    { code: "+357", name: "CY" },
    { code: "+420", name: "CZ" },
    { code: "+243", name: "CD" },
    { code: "+45", name: "DK" },
    { code: "+253", name: "DJ" },
    { code: "+1-767", name: "DM" },
    { code: "+1-809", name: "DO" },
    { code: "+1-829", name: "DO" },
    { code: "+1-849", name: "DO" },
    { code: "+670", name: "TL" },
    { code: "+593", name: "EC" },
    { code: "+20", name: "EG" },
    { code: "+503", name: "SV" },
    { code: "+240", name: "GQ" },
    { code: "+291", name: "ER" },
    { code: "+372", name: "EE" },
    { code: "+251", name: "ET" },
    { code: "+500", name: "FK" },
    { code: "+298", name: "FO" },
    { code: "+679", name: "FJ" },
    { code: "+358", name: "FI" },
    { code: "+33", name: "FR" },
    { code: "+689", name: "PF" },
    { code: "+241", name: "GA" },
    { code: "+220", name: "GM" },
    { code: "+995", name: "GE" },
    { code: "+49", name: "DE" },
    { code: "+233", name: "GH" },
    { code: "+350", name: "GI" },
    { code: "+30", name: "GR" },
    { code: "+299", name: "GL" },
    { code: "+1-473", name: "GD" },
    { code: "+1-671", name: "GU" },
    { code: "+502", name: "GT" },
    { code: "+44-1481", name: "GG" },
    { code: "+224", name: "GN" },
    { code: "+245", name: "GW" },
    { code: "+592", name: "GY" },
    { code: "+509", name: "HT" },
    { code: "+504", name: "HN" },
    { code: "+852", name: "HK" },
    { code: "+36", name: "HU" },
    { code: "+354", name: "IS" },
    { code: "+91", name: "IN" },
    { code: "+62", name: "ID" },
    { code: "+98", name: "IR" },
    { code: "+964", name: "IQ" },
    { code: "+353", name: "IE" },
    { code: "+44-1624", name: "IM" },
    { code: "+972", name: "IL" },
    { code: "+39", name: "IT" },
    { code: "+225", name: "CI" },
    { code: "+1-876", name: "JM" },
    { code: "+81", name: "JP" },
    { code: "+44-1534", name: "JE" },
    { code: "+962", name: "JO" },
    { code: "+7", name: "KZ" },
    { code: "+254", name: "KE" },
    { code: "+686", name: "KI" },
    { code: "+383", name: "XK" },
    { code: "+965", name: "KW" },
    { code: "+996", name: "KG" },
    { code: "+856", name: "LA" },
    { code: "+371", name: "LV" },
    { code: "+961", name: "LB" },
    { code: "+266", name: "LS" },
    { code: "+231", name: "LR" },
    { code: "+218", name: "LY" },
    { code: "+423", name: "LI" },
    { code: "+370", name: "LT" },
    { code: "+352", name: "LU" },
    { code: "+853", name: "MO" },
    { code: "+389", name: "MK" },
    { code: "+261", name: "MG" },
    { code: "+265", name: "MW" },
    { code: "+60", name: "MY" },
    { code: "+960", name: "MV" },
    { code: "+223", name: "ML" },
    { code: "+356", name: "MT" },
    { code: "+692", name: "MH" },
    { code: "+222", name: "MR" },
    { code: "+230", name: "MU" },
    { code: "+262", name: "YT" },
    { code: "+52", name: "MX" },
    { code: "+691", name: "FM" },
    { code: "+373", name: "MD" },
    { code: "+377", name: "MC" },
    { code: "+976", name: "MN" },
    { code: "+382", name: "ME" },
    { code: "+1-664", name: "MS" },
    { code: "+212", name: "MA" },
    { code: "+258", name: "MZ" },
    { code: "+95", name: "MM" },
    { code: "+264", name: "NA" },
    { code: "+674", name: "NR" },
    { code: "+977", name: "NP" },
    { code: "+31", name: "NL" },
    { code: "+687", name: "NC" },
    { code: "+64", name: "NZ" },
    { code: "+505", name: "NI" },
    { code: "+227", name: "NE" },
    { code: "+234", name: "NG" },
    { code: "+683", name: "NU" },
    { code: "+850", name: "KP" },
    { code: "+1-670", name: "MP" },
    { code: "+47", name: "NO" },
    { code: "+968", name: "OM" },
    { code: "+92", name: "PK" },
    { code: "+680", name: "PW" },
    { code: "+970", name: "PS" },
    { code: "+507", name: "PA" },
    { code: "+675", name: "PG" },
    { code: "+595", name: "PY" },
    { code: "+51", name: "PE" },
    { code: "+63", name: "PH" },
    { code: "+64", name: "PN" },
    { code: "+48", name: "PL" },
    { code: "+351", name: "PT" },
    { code: "+1-787", name: "PR" },
    { code: "+1-939", name: "PR" },
    { code: "+974", name: "QA" },
    { code: "+242", name: "CG" },
    { code: "+262", name: "RE" },
    { code: "+40", name: "RO" },
    { code: "+7", name: "RU" },
    { code: "+250", name: "RW" },
    { code: "+590", name: "BL" },
    { code: "+290", name: "SH" },
    { code: "+1-869", name: "KN" },
    { code: "+1-758", name: "LC" },
    { code: "+590", name: "MF" },
    { code: "+508", name: "PM" },
    { code: "+1-784", name: "VC" },
    { code: "+685", name: "WS" },
    { code: "+378", name: "SM" },
    { code: "+239", name: "ST" },
    { code: "+966", name: "SA" },
    { code: "+221", name: "SN" },
    { code: "+381", name: "RS" },
    { code: "+248", name: "SC" },
    { code: "+232", name: "SL" },
    { code: "+65", name: "SG" },
    { code: "+1-721", name: "SX" },
    { code: "+421", name: "SK" },
    { code: "+386", name: "SI" },
    { code: "+677", name: "SB" },
    { code: "+252", name: "SO" },
    { code: "+27", name: "ZA" },
    { code: "+82", name: "KR" },
    { code: "+211", name: "SS" },
    { code: "+34", name: "ES" },
    { code: "+94", name: "LK" },
    { code: "+249", name: "SD" },
    { code: "+597", name: "SR" },
    { code: "+47", name: "SJ" },
    { code: "+268", name: "SZ" },
    { code: "+46", name: "SE" },
    { code: "+41", name: "CH" },
    { code: "+963", name: "SY" },
    { code: "+886", name: "TW" },
    { code: "+992", name: "TJ" },
    { code: "+255", name: "TZ" },
    { code: "+66", name: "TH" },
    { code: "+228", name: "TG" },
    { code: "+690", name: "TK" },
    { code: "+676", name: "TO" },
    { code: "+1-868", name: "TT" },
    { code: "+216", name: "TN" },
    { code: "+90", name: "TR" },
    { code: "+993", name: "TM" },
    { code: "+1-649", name: "TC" },
    { code: "+688", name: "TV" },
    { code: "+1-340", name: "VI" },
    { code: "+256", name: "UG" },
    { code: "+380", name: "UA" },
    { code: "+971", name: "AE" },
    { code: "+44", name: "GB" },
    { code: "+1", name: "US" },
    { code: "+598", name: "UY" },
    { code: "+998", name: "UZ" },
    { code: "+678", name: "VU" },
    { code: "+379", name: "VA" },
    { code: "+58", name: "VE" },
    { code: "+84", name: "VN" },
    { code: "+681", name: "WF" },
    { code: "+212", name: "EH" },
    { code: "+967", name: "YE" },
    { code: "+260", name: "ZM" },
    { code: "+263", name: "ZW" }
];

export function PhoneInput({ name, defaultValue = "", className, ...props }: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState("+91");
  const [number, setNumber] = React.useState(defaultValue);

  const fullNumber = `${countryCode}${number}`;
  
  const getCountryIsoCode = (code: string) => {
    return countries.find(c => c.code === code)?.name.toLowerCase();
  }

  return (
    <div className={cn("flex items-center", className)}>
      <input type="hidden" name={name} value={fullNumber} />
      <Select value={countryCode} onValueChange={setCountryCode}>
        <SelectTrigger className="w-[120px] rounded-r-none focus:ring-0">
          <SelectValue placeholder="Code">
            <span className="flex items-center gap-2">
                <Image src={`https://flagcdn.com/16x12/${getCountryIsoCode(countryCode)}.png`} width={16} height={12} alt="Country Flag" />
                {countryCode}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
            {countries.map((country) => {
              const uniqueValue = `${country.name}-${country.code}`;
              return (
                <SelectItem key={uniqueValue} value={country.code}>
                    <span className="flex items-center gap-2">
                        <Image src={`https://flagcdn.com/16x12/${country.name.toLowerCase()}.png`} width={16} height={12} alt={`${country.name} Flag`} />
                        {country.name} ({country.code})
                    </span>
                </SelectItem>
            )})}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="rounded-l-none"
        placeholder="9876543210"
        {...props}
      />
    </div>
  );
}
    

    