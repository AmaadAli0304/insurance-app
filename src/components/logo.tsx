import { HeartPulse } from 'lucide-react';
import Image from "next/image";
export function Logo() {
  return (
    <div  className="flex items-center gap-2">
      <Image
        src="/images/logo.png"
        alt="One Stop Logo"
        width={70}
        height={70}
        priority
        data-ai-hint="logo"
      />
      <h1 className="text-lg font-bold">One Stop</h1>
    </div>
  );
}
