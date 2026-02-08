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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
        data: name ? { name } : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_description || data.msg || 'Signup failed' });
    }

    // If auto-confirmed (no email verification required), set session cookie
    if (data.access_token) {
      setSessionCookie(res, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      });

      return res.status(200).json({
        user: data.user,
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
        },
      });
    }

    // Email confirmation required
    return res.status(200).json({
      user: data.user || data,
      confirmationRequired: true,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
