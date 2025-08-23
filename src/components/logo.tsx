import { HeartPulse } from 'lucide-react';
import Image from "next/image";
export function Logo() {
  return (
    <div  className="flex items-center gap-2">
      <Image
        src="/images/logo.png"
        alt="One Stop Healthcare Solution Logo"
        width={40}
        height={40}
        priority
      />
      <h1 className="text-sm font-bold">One Stop<br/>Healthcare Solution</h1>
    </div>
  );
}
