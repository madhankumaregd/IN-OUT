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
  if (req.method !== 'GET') return res.status(405).end();
  const userId = await authenticate(req, res);
  if (!userId) return;

  const now = new Date();
  const month = Number(req.query.month || now.getMonth() + 1);
  const year = Number(req.query.year || now.getFullYear());

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  // This month aggregates
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'income', date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'expense', date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount || 0;
  const totalExpense = expenseAgg._sum.amount || 0;
  const balance = totalIncome - totalExpense;

  // Last 6 months trend
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const [inc, exp] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, type: 'income', date: { gte: s, lte: e } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'expense', date: { gte: s, lte: e } }, _sum: { amount: true } }),
    ]);
    trend.push({
      month: d.toLocaleString('default', { month: 'short' }),
      income: inc._sum.amount || 0,
      expense: exp._sum.amount || 0,
    });
  }

  // Expense by category this month
  const categoryBreakdown = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'expense', date: { gte: start, lte: end } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const categoryIds = categoryBreakdown.map(c => c.categoryId).filter(Boolean);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const breakdown = categoryBreakdown.map(c => ({
    categoryId: c.categoryId,
    name: catMap[c.categoryId]?.name || 'Uncategorized',
    icon: catMap[c.categoryId]?.icon || '💰',
    color: catMap[c.categoryId]?.color || '#6366f1',
    amount: c._sum.amount || 0,
  }));

  // Recent transactions
  const recent = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 5,
  });

  // All-time balance
  const [allInc, allExp] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId, type: 'income' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: 'expense' }, _sum: { amount: true } }),
  ]);
  const netWorth = (allInc._sum.amount || 0) - (allExp._sum.amount || 0);

  return res.json({ totalIncome, totalExpense, balance, netWorth, trend, breakdown, recent });
}
