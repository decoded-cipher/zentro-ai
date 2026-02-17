# Zentro AI Promo Site

Promotional website for Zentro AI, built with Astro and deployed on Cloudflare Pages/Workers.

## Features

- **Waitlist Signup**: Invite-only waitlist with Cloudflare D1 database and Resend email notifications
- **Server Actions**: Type-safe form handling with Astro Actions
- **Hybrid Rendering**: Static pages with dynamic server actions

## Setup

### Prerequisites

- Node.js 18+ (or Bun)
- Cloudflare account
- Resend account (for email notifications)

### Installation

```bash
bun install
```

### Database Setup

1. Create a D1 database:
```bash
bunx wrangler d1 create zentro-waitlist
```

2. Copy `wrangler.jsonc.example` to `wrangler.jsonc`:
```bash
cp wrangler.jsonc.example wrangler.jsonc
```

3. Copy the `database_id` from the output and update `wrangler.jsonc` with your actual values:
   - Replace `YOUR_D1_DATABASE_ID_HERE` with your actual database ID
   - Replace `YOUR_TURNSTILE_SITE_KEY_HERE` with your Turnstile site key (optional)

**Note:** `wrangler.jsonc` is gitignored - keep your real values private!

3. Run migrations:
```bash
# Local development
bun run db:migrate

# Production
bun run db:migrate:remote
```

### Environment Variables

1. Copy `.dev.vars.example` to `.dev.vars`:
```bash
cp .dev.vars.example .dev.vars
```

2. Fill in your values:
- `PUBLIC_TURNSTILE_SITE_KEY`: (Optional) Cloudflare Turnstile site key from [Cloudflare Dashboard](https://dash.cloudflare.com/)
- `TURNSTILE_SECRET_KEY`: (Optional) Cloudflare Turnstile secret key for server-side verification
- `DISCORD_WEBHOOK_URL`: (Optional) Discord webhook URL for notifications - [Create webhook](https://discord.com/developers/docs/resources/webhook)

3. For production, set secrets via Wrangler:
```bash
bunx wrangler secret put TURNSTILE_SECRET_KEY  # Optional
bunx wrangler secret put DISCORD_WEBHOOK_URL   # Optional
```

4. Set Turnstile site key in `wrangler.jsonc` under `vars.PUBLIC_TURNSTILE_SITE_KEY` (optional)

### Development

```bash
bun run dev
```

The site runs on `http://localhost:4321` with Cloudflare runtime emulation.

### Preview (with Wrangler)

```bash
bun run preview
```

This runs `wrangler dev` which provides full Cloudflare bindings and D1 access.

### Build

```bash
bun run build
```

### Deploy

Deploy to Cloudflare Pages or Workers:

```bash
bunx wrangler deploy
```

Or connect your GitHub repo to Cloudflare Pages for automatic deployments.

## Project Structure

```
apps/promo/
├── src/
│   ├── actions/          # Server actions (waitlist form)
│   ├── components/       # Astro components
│   ├── layouts/          # Page layouts
│   └── pages/            # Routes
├── public/               # Static assets
├── schema.sql            # D1 database schema
├── wrangler.jsonc        # Cloudflare configuration
└── astro.config.mjs     # Astro configuration
```

## Waitlist Flow

1. User submits email and optional name via form
2. Form calls `actions.joinWaitlist()` server action
3. Action validates input and inserts into D1 database
4. Resend sends notification email to admin
5. User sees success message

## Database Schema

The waitlist table stores:
- `id`: Auto-increment primary key
- `email`: Unique email address
- `name`: Optional name
- `source`: Source identifier (default: 'promo')
- `created_at`: Timestamp

## License

MIT
