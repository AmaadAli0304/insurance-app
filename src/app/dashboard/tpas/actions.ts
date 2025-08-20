
"use server";

import { mockTPAs } from "@/lib/mock-data";
import { TPA } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddTPA(prevState: { message: string }, formData: FormData) {
    const newTPAData = {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        portalLink: formData.get("portalLink") as string,
    };

  // Basic validation
  if (!newTPAData.name || !newTPAData.email || !newTPAData.address) {
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
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        portalLink: formData.get("portalLink") as string,
    };
  
  if (!tpaId) {
      return { message: "TPA ID is missing."}
  }
  
  if (!updatedTPAData.name || !updatedTPAData.email || !updatedTPAData.address) {
    return { message: "Please fill all required fields." };
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
