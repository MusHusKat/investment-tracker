# Deployment Guide — Vercel + Neon

## 1. Set up Neon (database)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project — name it `investment-tracker`, region **US East** (or closest to you)
3. In your project dashboard, go to **Connection Details**
4. You need two connection strings:
   - **Pooled** (for the app) — select "Connection pooling" mode
   - **Direct** (for migrations) — select "Direct connection" mode
5. Keep this tab open — you'll need both strings in step 3

## 2. Set up Vercel (hosting)

1. Push the `investment-tracker` directory to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import that repo
3. Vercel will auto-detect it as a Next.js app — leave build settings as-is
4. Before deploying, add these **Environment Variables** in the Vercel dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string |
| `NEXTAUTH_URL` | Your Vercel deployment URL e.g. `https://investment-tracker-xyz.vercel.app` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste the output |
| `DEV_AUTH_ENABLED` | `false` |

5. Click **Deploy**

## 3. Run database migrations

Once deployed, run migrations against the Neon database from your local machine:

```bash
# Set your Neon direct URL temporarily
export DIRECT_URL="your-neon-direct-connection-string"
export DATABASE_URL="your-neon-direct-connection-string"

cd investment-tracker
pnpm db:migrate
```

Or use the Neon SQL editor to verify the tables were created.

## 4. Create user accounts

```bash
# Point to the Neon database
export DATABASE_URL="your-neon-direct-connection-string"
export DIRECT_URL="your-neon-direct-connection-string"

pnpm db:add-user alice@example.com securepassword "Alice Smith"
pnpm db:add-user bob@example.com securepassword "Bob Jones"
```

## 5. Update the mobile app

1. Open `investment-tracker-mobile/app.json`
2. Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL:

```json
"extra": {
  "apiBaseUrl": "https://investment-tracker-xyz.vercel.app"
}
```

3. Rebuild/reload the app

## 6. Verify

- Open your Vercel URL in a browser — you should see the login page
- Log in with a user you created in step 4
- Test the mobile app against the live backend

---

## Ongoing: adding new users

```bash
export DATABASE_URL="your-neon-direct-connection-string"
export DIRECT_URL="your-neon-direct-connection-string"

pnpm db:add-user newperson@example.com theirpassword "Their Name"
```

## Ongoing: deploying updates

Push to your GitHub repo's main branch — Vercel redeploys automatically.

If you've changed the database schema (added a migration):
```bash
export DATABASE_URL="your-neon-direct-connection-string"
export DIRECT_URL="your-neon-direct-connection-string"
pnpm db:migrate
```
