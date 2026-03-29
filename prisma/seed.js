const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@inandout.app' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@inandout.app',
      password: hashedPassword,
      currency: 'USD',
    },
  });

  // Seed categories
  const expenseCategories = [
    { name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
    { name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
    { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense' },
    { name: 'Health', icon: '💊', color: '#10b981', type: 'expense' },
    { name: 'Housing', icon: '🏠', color: '#f59e0b', type: 'expense' },
    { name: 'Utilities', icon: '💡', color: '#06b6d4', type: 'expense' },
    { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense' },
  ];

  const incomeCategories = [
    { name: 'Salary', icon: '💼', color: '#22c55e', type: 'income' },
    { name: 'Freelance', icon: '💻', color: '#14b8a6', type: 'income' },
    { name: 'Investment', icon: '📈', color: '#f59e0b', type: 'income' },
    { name: 'Gift', icon: '🎁', color: '#ec4899', type: 'income' },
    { name: 'Other Income', icon: '💰', color: '#6366f1', type: 'income' },
  ];

  const allCategories = [...expenseCategories, ...incomeCategories];
  const createdCategories = [];

  for (const cat of allCategories) {
    const created = await prisma.category.upsert({
      where: { id: `seed-${user.id}-${cat.name}` },
      update: {},
      create: {
        id: `seed-${user.id}-${cat.name}`,
        ...cat,
        userId: user.id,
      },
    });
    createdCategories.push(created);
  }

  console.log('✅ Seeded demo user and categories');
  console.log('📧 Demo login: demo@inandout.app / demo1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
