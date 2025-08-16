
"use server";

import { mockTPAs, mockCompanies, mockHospitals } from "@/lib/mock-data";
import { TPA } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddTPA(prevState: { message: string }, formData: FormData) {
    const newTPAData = {
        name: formData.get("name") as string,
        contactPerson: formData.get("contactPerson") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        slaDays: Number(formData.get("slaDays")),
        remarks: formData.get("remarks") as string,
        servicesOffered: (formData.get("servicesOffered") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        associatedInsuranceCompanies: (formData.get("associatedInsuranceCompanies") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        associatedHospitals: (formData.get("associatedHospitals") as string || '').split(',').map(s => s.trim()).filter(Boolean),
    };

  // Basic validation
  if (!newTPAData.name || !newTPAData.contactPerson || !newTPAData.email || !newTPAData.slaDays) {
    return { message: "Please fill all required fields." };
  }

  const newTPA: TPA = {
    tpaId: `tpa-${Date.now()}`,
    ...newTPAData,
  };

  mockTPAs.push(newTPA);
  
  revalidatePath('/dashboard/tpas');
  redirect('/dashboard/tpas');
}

export async function handleUpdateTPA(prevState: { message: string }, formData: FormData) {
  const tpaId = formData.get("tpaId") as string;
  const updatedTPAData = {
        name: formData.get("name") as string,
        contactPerson: formData.get("contactPerson") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        slaDays: Number(formData.get("slaDays")),
        remarks: formData.get("remarks") as string,
        servicesOffered: (formData.get("servicesOffered") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        associatedInsuranceCompanies: (formData.get("associatedInsuranceCompanies") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        associatedHospitals: (formData.get("associatedHospitals") as string || '').split(',').map(s => s.trim()).filter(Boolean),
    };
  
  if (!tpaId) {
      return { message: "TPA ID is missing."}
  }

  const tpaIndex = mockTPAs.findIndex(t => t.tpaId === tpaId);

  if (tpaIndex === -1) {
    return { message: "TPA not found." };
  }

  mockTPAs[tpaIndex] = {
    ...mockTPAs[tpaIndex],
    ...updatedTPAData,
  };

  revalidatePath('/dashboard/tpas');
  redirect('/dashboard/tpas');
}

export async function handleDeleteTPA(formData: FormData) {
    const tpaId = formData.get("tpaId") as string;
    const index = mockTPAs.findIndex(t => t.tpaId === tpaId);
    if (index > -1) {
        mockTPAs.splice(index, 1);
    }
    revalidatePath('/dashboard/tpas');
}
