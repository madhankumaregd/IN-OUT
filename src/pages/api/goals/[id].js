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
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'PUT') {
    const { name, targetAmount, savedAmount, deadline, icon } = req.body;
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        name: name ?? goal.name,
        targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : goal.targetAmount,
        savedAmount: savedAmount !== undefined ? parseFloat(savedAmount) : goal.savedAmount,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : goal.deadline,
        icon: icon ?? goal.icon,
      },
    });
    return res.json({ goal: updated });
  }

  if (req.method === 'DELETE') {
    await prisma.goal.delete({ where: { id } });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
