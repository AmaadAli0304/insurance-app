import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Redirect to the default login page for a specific role.
  // Company Admin is a reasonable default.
  redirect('/login/company-admin');
  return null;
}
