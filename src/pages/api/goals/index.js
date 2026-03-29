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
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ goals });
  }

  if (req.method === 'POST') {
    const { name, targetAmount, savedAmount, deadline, icon } = req.body;
    if (!name || !targetAmount) return res.status(400).json({ error: 'name and targetAmount required' });
    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        savedAmount: savedAmount ? parseFloat(savedAmount) : 0,
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || '🎯',
        userId,
      },
    });
    return res.status(201).json({ goal });
  }

  return res.status(405).end();
}
