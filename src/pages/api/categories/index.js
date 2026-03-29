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

  if (req.method === 'GET') {
    const { type } = req.query;
    const where = { userId };
    if (type) where.type = type;
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return res.json({ categories });
  }

  if (req.method === 'POST') {
    const { name, icon, color, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const category = await prisma.category.create({
      data: { name, icon: icon || '💰', color: color || '#6366f1', type, userId },
    });
    return res.status(201).json({ category });
  }

  return res.status(405).end();
}
