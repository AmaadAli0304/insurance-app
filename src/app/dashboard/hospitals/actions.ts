
"use server";

import { redirect } from 'next/navigation';

export async function handleAddHospital(prevState: { message: string }, formData: FormData) {
  const name = formData.get("name");
  const address = formData.get("address");
  const contact = formData.get("contact");

  if (!name || !address || !contact) {
    return { message: "Please fill all fields." };
  }

  // In a real application, you would add this to your database.
  // For this demo, we'll just log it and redirect.
  console.log("New Hospital Added:", { name, address, contact });
  
  // We are not actually mutating mock data here as it won't persist across requests.
  // In a real app, after successful DB insertion:
  redirect('/dashboard/hospitals');
}
