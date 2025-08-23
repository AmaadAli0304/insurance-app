
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

// Manual mapping for special cases
const breadcrumbNameMap: Record<string, string> = {
  "tpas": "TPA",
  "pre-auths": "Pre-Auth",
  "company-hospitals": "Hospital",
  "companies": "Company",
  "hospitals": "Hospital",
  "staff": "Staff Member",
  "claims": "Claim",
  "patients": "Patient",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    let label = capitalize(segment);

    if (segment === 'new' && index > 0) {
      const parentSegment = segments[index - 1];
      const singularParentLabel = breadcrumbNameMap[parentSegment] || capitalize(parentSegment).replace(/s$/, '');
      label = `Add New ${singularParentLabel}`;
    }


    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex">
      <ol className="flex items-center gap-1.5">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center gap-1.5">
            <Link
              href={breadcrumb.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                breadcrumb.isLast ? "text-foreground" : "text-muted-foreground"
              )}
              aria-current={breadcrumb.isLast ? "page" : undefined}
            >
              {breadcrumb.label}
            </Link>
            {!breadcrumb.isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
