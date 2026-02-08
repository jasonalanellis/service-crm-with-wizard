import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const COOKIE_NAME = 'lss_session';

function parseCookie(req: VercelRequest): { access_token?: string; refresh_token?: string; expires_at?: number } | null {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = parseCookie(req);

  // Try to revoke the token server-side (best effort)
  if (session?.access_token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
      });
    } catch {
      // Ignore — we're clearing the cookie regardless
    }
  }

  // Clear the cookie
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);

  return res.status(200).json({ success: true });
}
