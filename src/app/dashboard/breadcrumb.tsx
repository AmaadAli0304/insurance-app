
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

  const isUUID = (segment: string) => {
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

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    let label = capitalize(segment);
    let isClickable = true;

    const isLastSegmentViewOrEdit = isLast && (segment === 'view' || segment === 'edit');
    if (isLastSegmentViewOrEdit && index > 0) {
        const parentSegment = segments[index-1];
        if(isUUID(parentSegment)){
            // This makes the ID segment un-clickable, which is what we want.
            // But we need to find it in the breadcrumbs array and modify it.
        }
    }


    if (segment === 'new' && index > 0) {
      const parentSegment = segments[index - 1];
      const singularParentLabel = breadcrumbNameMap[parentSegment] || capitalize(parentSegment).replace(/s$/, '');
      label = `Add New ${singularParentLabel}`;
    } else if (breadcrumbNameMap[segment]) {
        label = breadcrumbNameMap[segment]
    }


    return { href, label, isLast, isClickable };
  });

  // A second pass to handle disabling the ID link
  const finalBreadcrumbs = breadcrumbs.map((breadcrumb, index) => {
    const currentSegment = segments[index];
    const isLastSegment = index === segments.length - 1;
    
    if (isUUID(currentSegment)) {
        const nextSegment = segments[index + 1];
        if(nextSegment === 'view' || nextSegment === 'edit') {
            return { ...breadcrumb, isClickable: false };
        }
    }

    if (isLastSegment) {
        return { ...breadcrumb, isClickable: false };
    }

    return breadcrumb;
  });


  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex">
      <ol className="flex items-center gap-1.5">
        {finalBreadcrumbs.map((breadcrumb, index) => (
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
