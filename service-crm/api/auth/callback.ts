import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const COOKIE_NAME = 'lss_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setSessionCookie(res: VercelResponse, session: { access_token: string; refresh_token: string; expires_at: number }) {
  const value = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Supabase sends tokens via query params for email confirmation / magic links / password reset
  const { access_token, refresh_token, type } = req.query as Record<string, string>;

  if (!access_token || !refresh_token) {
    // No tokens — redirect to app root (client will handle showing login)
    return res.redirect(302, '/');
  }

  // Validate the access token by fetching the user
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!userRes.ok) {
      // Invalid token — redirect to login
      return res.redirect(302, '/');
    }

    // Token is valid — set the session cookie
    // Supabase access tokens expire in 1 hour by default
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    setSessionCookie(res, {
      access_token: access_token as string,
      refresh_token: refresh_token as string,
      expires_at: expiresAt,
    });

    // Redirect based on the auth action type
    const redirectTo = type === 'recovery' ? '/?reset_password=1' : '/';
    return res.redirect(302, redirectTo);
  } catch {
    return res.redirect(302, '/');
  }
}
