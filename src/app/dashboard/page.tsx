
"use client";

import { useAuth } from "@/components/auth-provider";
import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { HospitalAdminDashboard } from "@/components/dashboard/hospital-admin/hospital-admin-dashboard";
import { HospitalStaffDashboard } from "@/components/dashboard/hospital-staff/hospital-staff-dashboard";
import { CompanyAdminDashboard } from "@/components/dashboard/company-admin/company-admin-dashboard";

export default function DashboardPage() {
  const { role } = useAuth();

  const renderDashboard = () => {
    switch (role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Hospital Admin':
        return <HospitalAdminDashboard />;
      case 'Hospital Staff':
        return <HospitalStaffDashboard />;
      case 'Company Admin':
        return <CompanyAdminDashboard />;
      default:
        // This can be a loading state or a fallback component
        return <div>Loading dashboard...</div>;
    }
  };

  return <>{renderDashboard()}</>;
}
