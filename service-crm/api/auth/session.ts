import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const COOKIE_NAME = 'lss_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

function setSessionCookie(res: VercelResponse, session: { access_token: string; refresh_token: string; expires_at: number }) {
  const value = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = parseCookie(req);
  if (!session?.access_token) {
    return res.status(200).json({ user: null, session: null });
  }

  // Check if token is expired (with 60s buffer)
  const now = Math.floor(Date.now() / 1000);
  const isExpired = session.expires_at ? now >= session.expires_at - 60 : false;

  if (isExpired && session.refresh_token) {
    // Refresh the token
    try {
      const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setSessionCookie(res, {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
        });

        return res.status(200).json({
          user: data.user,
          session: {
            expires_at: data.expires_at,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_type: data.token_type,
          },
        });
      }

      // Refresh failed — clear cookie, user must re-login
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
      return res.status(200).json({ user: null, session: null });
    } catch {
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
      return res.status(200).json({ user: null, session: null });
    }
  }

  // Token not expired — validate it by fetching user
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!userRes.ok) {
      // Token invalid — try refresh
      if (session.refresh_token) {
        const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSessionCookie(res, {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
          });

          return res.status(200).json({
            user: data.user,
            session: {
              expires_at: data.expires_at,
              token_type: data.token_type,
            },
          });
        }
      }

      // All attempts failed
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
      return res.status(200).json({ user: null, session: null });
    }

    const user = await userRes.json();
    return res.status(200).json({
      user,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      },
    });
  } catch {
    return res.status(200).json({ user: null, session: null });
  }
}
