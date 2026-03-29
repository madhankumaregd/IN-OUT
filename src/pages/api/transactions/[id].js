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
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx || tx.userId !== userId) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'PUT') {
    const { amount, type, description, date, categoryId } = req.body;
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : tx.amount,
        type: type || tx.type,
        description: description || tx.description,
        date: date ? new Date(date) : tx.date,
        categoryId: categoryId !== undefined ? categoryId : tx.categoryId,
      },
      include: { category: true },
    });
    return res.json({ transaction: updated });
  }

  if (req.method === 'DELETE') {
    await prisma.transaction.delete({ where: { id } });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
