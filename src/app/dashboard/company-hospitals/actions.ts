
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import pool, { sql, poolConnect } from "@/lib/db";
import type { Staff, Company, TPA } from "@/lib/types";

export async function getStaff(): Promise<Staff[]> {
  try {
    await poolConnect;
    const result = await pool.request()
      .query('SELECT id, name FROM staff');
    return result.recordset as Staff[];
  } catch (error) {
      const dbError = error as Error;
      throw new Error(`Error fetching staff: ${dbError.message}`);
  }
}

export async function getCompaniesForForm(): Promise<Pick<Company, 'id' | 'name'>[]> {
    try {
        await poolConnect;
        const result = await pool.request().query('SELECT id, name FROM companies');
        return result.recordset;
    } catch (error) {
        const dbError = error as Error;
        throw new Error(`Error fetching companies for form: ${dbError.message}`);
    }
}

export async function getTPAsForForm(): Promise<Pick<TPA, 'id' | 'name'>[]> {
    try {
        await poolConnect;
        const result = await pool.request().query('SELECT id, name FROM tpas');
        return result.recordset.map(r => ({...r, id: r.id}));
    } catch (error) {
        const dbError = error as Error;
        throw new Error(`Error fetching TPAs for form: ${dbError.message}`);
    }
}


export async function handleAddHospital(prevState: { message: string }, formData: FormData) {
    const companyId = formData.get("companyId") as string;
    const newHospitalData = {
        name: formData.get("name") as string,
        location: formData.get("location") as string,
        contactPerson: formData.get("contactPerson") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        assignedCompanies: (formData.get("assignedInsuranceCompanies") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        assignedTPAs: (formData.get("assignedTPAs") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        assignedStaff: (formData.get("assignedStaff") as string || '').split(',').map(s => s.trim()).filter(Boolean),
    };

  // Basic validation
  if (!newHospitalData.name || !newHospitalData.location || !newHospitalData.address || !newHospitalData.email) {
    return { message: "Please fill all required fields: Name, Location, Address, and Email." };
  }

  // Ensure the current company is always assigned
  if (!newHospitalData.assignedCompanies.includes(companyId)) {
      newHospitalData.assignedCompanies.push(companyId);
  }

  const newHospital = {
    id: `hosp-${Date.now()}`,
    ...newHospitalData,
    // Default empty values for other fields
    contact: newHospitalData.phone,
  };

  // This part would need to be updated to write to the DB instead of mock data
  // For now, we continue with mock data for simplicity of the request
  // mockHospitals.push(newHospital);
  
  console.log("Would be adding to DB:", newHospital);
  
  revalidatePath('/dashboard/company-hospitals');
  redirect('/dashboard/company-hospitals');
}

export async function handleUpdateHospital(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedData = {
        name: formData.get("name") as string,
        location: formData.get("location") as string,
        contactPerson: formData.get("contactPerson") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        assignedCompanies: (formData.get("assignedInsuranceCompanies") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        assignedTPAs: (formData.get("assignedTPAs") as string || '').split(',').map(s => s.trim()).filter(Boolean),
        assignedStaff: (formData.get("assignedStaff") as string || '').split(',').map(s => s.trim()).filter(Boolean),
    };

  if (!id) {
    return { message: "Hospital ID is missing." };
  }
  
  if (!updatedData.name || !updatedData.location || !updatedData.address || !updatedData.email) {
    return { message: "Please fill all required fields: Name, Location, Address, and Email." };
  }

  // This part would need to be updated to write to the DB instead of mock data
  // For now, we continue with mock data for simplicity of the request
  // const hospitalIndex = mockHospitals.findIndex(h => h.id === id);

  // if (hospitalIndex === -1) {
  //   return { message: "Hospital not found." };
  // }

  // mockHospitals[hospitalIndex] = {
  //   ...mockHospitals[hospitalIndex],
  //   ...updatedData,
  //   contact: updatedData.phone || mockHospitals[hospitalIndex].contact,
  // };
  
  console.log("Would be updating in DB:", id, updatedData);


  revalidatePath('/dashboard/company-hospitals');
  redirect('/dashboard/company-hospitals');
}

export async function handleDeleteHospital(formData: FormData) {
    const id = formData.get("id") as string;
    // This part would need to be updated to write to the DB instead of mock data
    // const index = mockHospitals.findIndex(h => h.id === id);
    // if (index > -1) {
    //     mockHospitals.splice(index, 1);
    // }
    console.log("Would be deleting from DB:", id);
    revalidatePath('/dashboard/company-hospitals');
}
