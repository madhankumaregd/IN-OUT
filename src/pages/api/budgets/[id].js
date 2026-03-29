import prisma from '../../../lib/prisma';
import { verifyToken, getTokenFromCookie } from '../../../lib/auth';

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

  const { id } = req.query;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'DELETE') {
    await prisma.budget.delete({ where: { id } });
    return res.json({ ok: true });
  }
  return res.status(405).end();
}
