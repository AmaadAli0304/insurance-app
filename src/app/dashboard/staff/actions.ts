
"use server";

import { mockStaff } from "@/lib/mock-data";
import { Staff } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddStaff(prevState: { message: string }, formData: FormData) {
  const newStaffData = {
    fullName: formData.get("fullName") as string,
    designation: formData.get("designation") as string,
    department: formData.get("department") as string,
    contactNumber: formData.get("contactNumber") as string,
    email: formData.get("email") as string,
    joiningDate: formData.get("joiningDate") as string,
    endDate: formData.get("endDate") as string || undefined,
    shiftTiming: formData.get("shiftTiming") as string || undefined,
    status: formData.get("status") as "Active" | "Inactive",
    companyId: formData.get("companyId") as string,
    hospitalId: formData.get("hospitalId") as string || undefined,
  };

  if (!newStaffData.fullName || !newStaffData.email || !newStaffData.companyId) {
    return { message: "Please fill all required fields." };
  }

  const newStaff: Staff = {
    id: `staff-${Date.now()}`,
    ...newStaffData,
  };

  mockStaff.push(newStaff);
  
  revalidatePath('/dashboard/staff');
  redirect('/dashboard/staff');
}

export async function handleUpdateStaff(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedStaffData = {
    fullName: formData.get("fullName") as string,
    designation: formData.get("designation") as string,
    department: formData.get("department") as string,
    contactNumber: formData.get("contactNumber") as string,
    email: formData.get("email") as string,
    joiningDate: formData.get("joiningDate") as string,
    endDate: formData.get("endDate") as string || undefined,
    shiftTiming: formData.get("shiftTiming") as string || undefined,
    status: formData.get("status") as "Active" | "Inactive",
    hospitalId: formData.get("hospitalId") as string || undefined,
  };

  if (!id) {
    return { message: "Staff ID is missing." };
  }

  const staffIndex = mockStaff.findIndex(s => s.id === id);

  if (staffIndex === -1) {
    return { message: "Staff member not found." };
  }

  mockStaff[staffIndex] = {
    ...mockStaff[staffIndex],
    ...updatedStaffData,
  };

  revalidatePath('/dashboard/staff');
  redirect('/dashboard/staff');
}

export async function handleDeleteStaff(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockStaff.findIndex(s => s.id === id);
    if (index > -1) {
        mockStaff.splice(index, 1);
    }
    revalidatePath('/dashboard/staff');
}
