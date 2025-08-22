import { HeartPulse } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <HeartPulse className="h-6 w-6 text-primary" />
      <h1 className="text-lg font-bold">One Stop Healthcare Solution</h1>
    </div>
  );
}
