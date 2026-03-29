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
    const now = new Date();
    const month = Number(req.query.month || now.getMonth() + 1);
    const year = Number(req.query.year || now.getFullYear());

    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    });
    return res.json({ budgets });
  }

  if (req.method === 'POST') {
    const { amount, categoryId, month, year } = req.body;
    if (!amount || !categoryId) return res.status(400).json({ error: 'amount and categoryId required' });

    const now = new Date();
    const m = Number(month || now.getMonth() + 1);
    const y = Number(year || now.getFullYear());

    // Calculate already spent
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    const spentAgg = await prisma.transaction.aggregate({
      where: { userId, categoryId, type: 'expense', date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const spent = spentAgg._sum.amount || 0;

    // Upsert budget
    const existing = await prisma.budget.findFirst({ where: { userId, categoryId, month: m, year: y } });
    let budget;
    if (existing) {
      budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: parseFloat(amount), spent },
        include: { category: true },
      });
    } else {
      budget = await prisma.budget.create({
        data: { amount: parseFloat(amount), spent, categoryId, userId, month: m, year: y },
        include: { category: true },
      });
    }
    return res.status(201).json({ budget });
  }

  return res.status(405).end();
}
