# Stock Signals

Backend API that monitors your stock portfolio and emails you when a stock's price drops below its 200-day Simple Moving Average (SMA) — a classic value buy signal.

## Stack

- **Runtime**: TypeScript + Vercel Serverless Functions
- **Database**: Supabase (Postgres)
- **Stock Data**: [Twelve Data](https://twelvedata.com) (free tier: 800 credits/day)
- **Email**: [Resend](https://resend.com) (free tier: 100 emails/day)
- **Cron**: Vercel Cron Jobs (runs weekdays at 9 PM UTC / 4 PM ET)

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd stock-signals
npm install
```

### 2. Create Supabase tables

Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

### 3. Get API keys

- **Twelve Data**: Sign up at [twelvedata.com](https://twelvedata.com) (free)
- **Resend**: Sign up at [resend.com](https://resend.com) (free)
- **Supabase**: Create a project at [supabase.com](https://supabase.com)

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```
TWELVE_DATA_API_KEY=your_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_key
CRON_SECRET=a_random_secret_string
ALERT_EMAIL=you@example.com
```

Set the same variables in your Vercel project settings.

### 5. Deploy

```bash
npx vercel --prod
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stocks` | List all portfolio stocks |
| POST | `/api/stocks` | Add a stock (`{ "symbol": "AAPL" }`) |
| DELETE | `/api/stocks/:id` | Remove a stock by ID |
| GET | `/api/stocks/alerts` | List recent buy signals |

## How it works

1. A Vercel cron job runs at **9 PM UTC on weekdays** (after US market close).
2. For each stock in your portfolio, it fetches the current price and 200-day SMA from Twelve Data.
3. If the price **crosses below** the SMA (wasn't below yesterday), it sends you an email via Resend and logs the alert.
4. Duplicate alerts are prevented by tracking the last known SMA status per stock.

## Testing

```bash
npm test
```

## Rate Limits

- **Twelve Data free tier**: 800 credits/day, 8 requests/min. Each stock uses 2 credits (quote + SMA). A 25-stock portfolio uses 50 credits/day.
- **Resend free tier**: 100 emails/day. More than enough for stock alerts.
- **Vercel free tier**: 2 cron jobs, once daily. This app uses 1.
