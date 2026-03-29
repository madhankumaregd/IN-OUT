import prisma from '../../../lib/prisma';
import { verifyToken, getTokenFromCookie } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

async function authenticate(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  const payload = await verifyToken(token);
  if (!payload) { res.status(401).json({ error: 'Invalid token' }); return null; }
  return payload.userId;
}

export default async function handler(req, res) {
  const userId = await authenticate(req, res);
  if (!userId) return;

  if (req.method === 'PUT') {
    const { name, currency, currentPassword, newPassword } = req.body;
    const data = {};
    if (name) data.name = name;
    if (currency) data.currency = currency;

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const valid = await bcrypt.compare(currentPassword || '', user.password);
      if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
      data.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, currency: true },
    });
    return res.json({ user: updated });
  }

  return res.status(405).end();
}
