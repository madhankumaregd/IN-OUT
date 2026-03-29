import { serialize } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Set-Cookie', serialize('token', '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 0, path: '/',
  }));
  return res.json({ ok: true });
}
