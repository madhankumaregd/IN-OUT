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

  // GET - list transactions
  if (req.method === 'GET') {
    const { type, categoryId, month, year, limit = '50', offset = '0' } = req.query;
    const where = { userId };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.transaction.count({ where }),
    ]);
    return res.json({ transactions, total });
  }

  // POST - create transaction
  if (req.method === 'POST') {
    const { amount, type, description, date, categoryId } = req.body;
    if (!amount || !type || !description)
      return res.status(400).json({ error: 'amount, type, description required' });

    const tx = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        description,
        date: date ? new Date(date) : new Date(),
        categoryId: categoryId || null,
        userId,
      },
      include: { category: true },
    });

    // Update budget spent if expense
    if (type === 'expense' && categoryId) {
      const txDate = new Date(tx.date);
      const budget = await prisma.budget.findFirst({
        where: {
          userId,
          categoryId,
          month: txDate.getMonth() + 1,
          year: txDate.getFullYear(),
        },
      });
      if (budget) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { spent: { increment: parseFloat(amount) } },
        });
      }
    }

    return res.status(201).json({ transaction: tx });
  }

  return res.status(405).end();
}
