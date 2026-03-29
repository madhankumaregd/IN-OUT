import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '../../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  // Seed default categories for new user
  const defaults = [
    { name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
    { name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
    { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense' },
    { name: 'Health', icon: '💊', color: '#10b981', type: 'expense' },
    { name: 'Housing', icon: '🏠', color: '#f59e0b', type: 'expense' },
    { name: 'Utilities', icon: '💡', color: '#06b6d4', type: 'expense' },
    { name: 'Salary', icon: '💼', color: '#22c55e', type: 'income' },
    { name: 'Freelance', icon: '💻', color: '#14b8a6', type: 'income' },
    { name: 'Investment', icon: '📈', color: '#f59e0b', type: 'income' },
    { name: 'Other', icon: '💰', color: '#6366f1', type: 'income' },
  ];
  await prisma.category.createMany({
    data: defaults.map(d => ({ ...d, userId: user.id })),
  });

  const token = await signToken({ userId: user.id, email: user.email });
  res.setHeader('Set-Cookie', serialize('token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  }));

  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
}
