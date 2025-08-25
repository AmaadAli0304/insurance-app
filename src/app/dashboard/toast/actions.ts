
"use server";

export async function handleShowToast(prevState: { message: string, type?: string }, formData: FormData) {
  return { message: "This is a test toast notification!", type: "success" };
}
