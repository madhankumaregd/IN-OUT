# IN & OUT — Personal Finance Tracker

A full-stack personal finance tracker built with **Next.js**, **Prisma**, and **SQLite**.

## Features

- 🔐 **Authentication** — Register / Login / Logout with JWT (httpOnly cookies)
- 💸 **Transactions** — Add, edit, delete income & expense transactions with categories
- 📊 **Dashboard** — Overview with charts: 6-month trend, category pie chart, spending breakdown
- 📅 **Budgets** — Set monthly budgets per category, track spending vs limit with progress bars
- 🎯 **Goals** — Create savings goals, add funds incrementally, track % complete
- ⊞ **Categories** — Manage custom income & expense categories with icons and colors
- ⚙️ **Settings** — Update name, currency, and password
- 📱 **Responsive** — Works on mobile and desktop

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (Pages Router) |
| Database | SQLite via Prisma ORM |
| Auth | JWT (jose) + bcryptjs |
| Charts | Recharts |
| Styling | Tailwind CSS + CSS Variables |
| Fonts | DM Serif Display + DM Sans (Google Fonts) |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `.env` (already created):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
```

> ⚠️ **Change `JWT_SECRET` before deploying to production!** Use a random 32+ character string.

### 3. Set up the database

```bash
npm run db:push
```

### 4. (Optional) Seed demo data

```bash
npm run db:seed
```

This creates a demo account:
- **Email:** demo@inandout.app
- **Password:** demo1234

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Deploy to Vercel (recommended)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `DATABASE_URL` — For production, switch to PostgreSQL (see below)
   - `JWT_SECRET` — A strong random string
4. Deploy!

### Switch to PostgreSQL for production

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your PostgreSQL connection string
3. Run `npx prisma db push`

### Deploy to Railway

1. Create a new project on [railway.app](https://railway.app)
2. Add a PostgreSQL database
3. Connect your GitHub repo
4. Set environment variables
5. Railway auto-deploys on push

### Deploy to Render

1. Create a new Web Service on [render.com](https://render.com)
2. Build command: `npm install && npx prisma generate && npx prisma db push && npm run build`
3. Start command: `npm start`
4. Add environment variables

---

## Project Structure

```
finance-tracker/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Demo data seeder
├── src/
│   ├── components/
│   │   ├── Layout.js      # Sidebar + main layout
│   │   ├── StatCard.js    # Dashboard stat cards
│   │   └── TransactionModal.js  # Add/edit transaction modal
│   ├── hooks/
│   │   └── useAuth.js     # Auth hook
│   ├── lib/
│   │   ├── auth.js        # JWT helpers
│   │   └── prisma.js      # Prisma client singleton
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auth/      # login, register, logout, me
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   ├── stats/     # dashboard stats
│   │   │   └── user/      # profile update
│   │   ├── dashboard.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── goals.js
│   │   ├── categories.js
│   │   ├── settings.js
│   │   ├── login.js
│   │   └── register.js
│   └── styles/
│       └── globals.css
├── .env
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List (filter by type, category, month, year) |
| POST | `/api/transactions` | Create |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List by month/year |
| POST | `/api/budgets` | Create or update |
| DELETE | `/api/budgets/:id` | Delete |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all goals |
| POST | `/api/goals` | Create |
| PUT | `/api/goals/:id` | Update (add funds etc.) |
| DELETE | `/api/goals/:id` | Delete |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List (filter by type) |
| POST | `/api/categories` | Create |
| DELETE | `/api/categories/:id` | Delete |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/dashboard` | Dashboard data (income, expenses, charts) |

---

## License

MIT — free to use, modify, and deploy.
