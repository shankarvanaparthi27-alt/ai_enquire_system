export const SUPER_ADMIN_EMAILS = [
  'vanaparthishankar27@gmail.com',
  'gowrishankarvanaparthi@gmail.com',
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
  process.env.SUPER_ADMIN_EMAIL,
]
  .filter(Boolean)
  .map((e) => (e as string).toLowerCase().trim());

export function isUserAdmin(
  user: { email?: string | null; role?: string; claims?: Record<string, unknown> } | null | undefined
): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();

  // 1. Super admin email addresses are always admin
  if (SUPER_ADMIN_EMAILS.includes(email)) return true;

  // 2. Any explicit student account is NEVER treated as admin
  if (user.role === 'student') return false;

  // 3. Otherwise, must have an explicitly verified admin or super_admin role
  if (user.role === 'super_admin' || user.role === 'admin') return true;

  return false;
}
