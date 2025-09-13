
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
  "profile": "Profile",
  "doctors": "Doctor",
  "invoices": "Invoice",
};

const isIdSegment = (segment: string) => {
    // A simple check for strings that look like IDs used in the app
    const patterns = [
        /^hosp-\d+$/,
        /^comp-\d+$/,
        /^pat-\d+$/,
        /^claim-\d+$/,
        /^req-\d+$/,
        /^\d+$/ 
    ];
    return patterns.some(p => p.test(segment));
}


export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    let href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    let label = capitalize(segment);
    let isClickable = !isLast;

    if (segment === 'new' && index > 0) {
      const parentSegment = segments[index - 1];
      const singularParentLabel = breadcrumbNameMap[parentSegment] || capitalize(parentSegment).replace(/s$/, '');
      label = `Add New ${singularParentLabel}`;
    } else if (isIdSegment(segment)) {
        if (index > 0) {
            const parentSegment = segments[index - 1];
            const singularParentLabel = breadcrumbNameMap[parentSegment] || capitalize(parentSegment).replace(/s$/, '');
            label = `${singularParentLabel} Details`;
            // If the next segment is 'view' or 'edit', make the Details breadcrumb link to the view page.
            if ((segments[index + 1] === 'view' || segments[index + 1] === 'edit') && !href.endsWith('/view')) {
                 href = href + '/view'; 
                 isClickable = true;
            } else if (!isLast) { // If it's not the last segment but not followed by view/edit
                 isClickable = true;
            }
        }
    } else if (breadcrumbNameMap[segment]) {
        label = breadcrumbNameMap[segment]
    }


    return { href, label, isLast, isClickable };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex">
      <ol className="flex items-center gap-1.5">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center gap-1.5">
            {breadcrumb.isClickable ? (
                <Link
                href={breadcrumb.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                {breadcrumb.label}
                </Link>
            ) : (
                 <span className={cn(
                    "text-sm font-medium",
                    breadcrumb.isLast ? "text-foreground" : "text-muted-foreground"
                 )}>{breadcrumb.label}</span>
            )}
           
            {!breadcrumb.isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
