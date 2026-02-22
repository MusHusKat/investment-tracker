# InvestTrack — Property Investment Portfolio Manager

Replace your spreadsheet with a fast, guided web app for tracking property investment KPIs across years and portfolios.

## Features

- **Dashboard** with KPI cards, trend charts, and property table (sortable)
- **Per-property detail** with year tabs, income/expense breakdowns, YoY deltas
- **Yearly Update Wizard** — guided 5-step flow to update a property in under 2 minutes
  - Copy last year's data as a baseline
  - YoY change warnings for large swings
- **Portfolio/Group builder** — combine any set of properties for aggregated analysis
- **CSV import** with preview and error reporting
- **CSV export** with computed KPIs included
- **Reports** page with multi-year summary table

---

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) + Docker Compose
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- Node.js 18+

### 1. Clone & install

```bash
git clone <your-repo-url> investment-tracker
cd investment-tracker
pnpm install
```

### 2. Environment

```bash
cp .env.example .env.local
# Edit .env.local if needed (defaults work for local Docker setup)
```

### 3. Start Postgres

```bash
docker compose up -d
```

### 4. Run migrations and seed

```bash
pnpm db:migrate   # runs prisma migrate dev
pnpm db:seed      # loads 3 properties + 11 years of data
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Login:** `demo@example.com` / `devpassword`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/investment_tracker` |
| `NEXTAUTH_URL` | App URL for NextAuth | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT secret (change in production) | `dev-secret-change-in-production` |
| `DEV_AUTH_ENABLED` | Auto-register users on first login | `true` |

---

## All Commands

```bash
pnpm dev              # start dev server
pnpm build            # production build
pnpm test             # run all tests
pnpm test:watch       # watch mode
pnpm db:generate      # regenerate Prisma client
pnpm db:migrate       # run migrations
pnpm db:push          # push schema (no migration file)
pnpm db:seed          # seed demo data
pnpm db:studio        # open Prisma Studio GUI
pnpm db:reset         # reset DB + reseed
```

---

## CSV Import Format

Upload a CSV with these columns:

```
property_name, year, rent, other_income, repairs, insurance, rates, strata,
pm_fees, utilities, other_expenses, interest_paid, principal_paid, capex, notes
```

- `property_name`: matched case-insensitively; new property created if not found
- `year`: 4-digit calendar year
- All monetary values: plain numbers (no `$` or commas)
- Existing year data is **overwritten** on reimport

Download the template from the Import page.

---

## Data Model

```
User
└── Property (name, address, tags, purchase_price, ownership_pct)
    ├── YearlySnapshot (per calendar year: income, expenses, loan totals, capex)
    ├── Valuation (dated valuations for yield/LVR calculations)
    └── Loan (metadata; yearly totals are in YearlySnapshot)

Portfolio → PortfolioProperty ← Property
```

---

## KPI Definitions

| KPI | Formula |
|---|---|
| Gross Income | Rent + Other Income |
| Total Opex | Sum of all operating expenses |
| NOI | Gross Income − Total Opex |
| Cashflow (pre-principal) | NOI − Interest Paid |
| Cashflow (post-principal) | NOI − Interest − Principal |
| Gross Yield | Annual Rent / Reference Value |
| Net Yield | NOI / Reference Value |
| Reference Value | Latest valuation ≤ Dec 31 of year, else purchase price |
| LVR | Loan Balance / Reference Value |
| Equity | Reference Value − Loan Balance |

---

## Deployment (Production)

### Vercel + Neon/Supabase

1. Create a managed Postgres database (Neon or Supabase free tier)
2. Push to GitHub and connect to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — your managed DB connection string
   - `NEXTAUTH_URL` — your Vercel deployment URL
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `DEV_AUTH_ENABLED` — `false` (or `true` if still in MVP mode)
4. Run `prisma migrate deploy` as a build step or one-time from local

### Render

1. Create a Postgres database in Render
2. Create a Web Service pointing to this repo
3. Build command: `pnpm install && pnpm db:generate && pnpm build`
4. Start command: `pnpm start`
5. Set environment variables as above

---

## Running Tests

```bash
pnpm test
```

Tests cover:
- Income, expense, NOI calculations
- Cashflow (pre/post principal)
- Yield (gross and net)
- Debt/equity/LVR
- Ownership percentage adjustments
- Full KPI aggregation across multiple properties
- Missing snapshot detection
- YoY delta and large-change flagging
- CSV parsing (valid rows, invalid rows, number formatting)
- CSV export row generation

---

## TODO (Post-MVP)

- [ ] Magic-link passwordless email auth (replace dev credentials provider)
- [ ] Financial year mode (e.g. Jul–Jun) in addition to calendar year
- [ ] Loan repayment calculator / amortization schedule
- [ ] Valuation management UI (add/edit valuations from property detail page)
- [ ] Bulk expense apply (one value → multiple properties)
- [ ] Ownership-adjusted view toggle on dashboard
- [ ] Mobile-responsive sidebar (hamburger menu)
- [ ] Dark mode toggle
- [ ] Property photos/documents attachment (S3)
- [ ] Webhook/email notifications for missing data reminders

---

## Folder Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── (auth)/login       # Login page
│   ├── dashboard          # Main dashboard
│   ├── properties/        # List, detail, edit, new
│   ├── wizard/            # Yearly Update Wizard
│   ├── portfolios/        # Portfolio list + combined view
│   ├── import/            # CSV import
│   ├── reports/           # Reports + export
│   └── api/               # REST API routes
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── layout/            # AppShell, Sidebar, TopBar
│   ├── dashboard/         # KPI cards, chart, property table
│   ├── properties/        # Property form, year tab
│   ├── wizard/            # 5 wizard step components
│   ├── portfolios/        # Portfolio builder, combined view
│   └── shared/            # CurrencyInput, YearPicker, TagInput, etc.
├── lib/
│   ├── calculations.ts    # Pure KPI functions (fully tested)
│   ├── aggregations.ts    # Multi-property aggregation
│   ├── csv.ts             # CSV parse + export
│   ├── prisma.ts          # DB client singleton
│   ├── auth.ts            # NextAuth config
│   ├── utils.ts           # Formatting utilities
│   └── actions/           # Server actions
├── types/
│   └── index.ts           # Shared TypeScript types
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Demo data (3 properties, 2021–2024)
tests/
├── calculations.test.ts
├── aggregations.test.ts
└── csv.test.ts
```
