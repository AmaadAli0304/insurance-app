import { HeartPulse } from 'lucide-react';
import Image from "next/image";
export function Logo() {
  return (
    <div  className="flex items-center gap-2">
      {/* <HeartPulse className="h-6 w-6 text-primary" /> */}
      <Image
  src="/images/logo.png"
  alt="My WebP Image"
  width={80}
  height={80}
  priority

/>
      <h1 style={{ fontSize: "12px", fontWeight: "bold" }} className="text-sm font-bold">One Stop Healthcare Solution</h1>
    </div>
  );
}
