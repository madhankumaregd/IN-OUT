import prisma from '../../../lib/prisma';
import { verifyToken, getTokenFromCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const payload = await verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, currency: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({ user });
}
