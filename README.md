# 🎄 Adventcord

Discord webhook notifications for [Advent of Code](https://adventofcode.com) leaderboards and new puzzle announcements.

## ✨ Features

- **Leaderboard Updates** — Get your private leaderboard standings sent to Discord at scheduled hours
- **New Puzzle Notifications** — Be notified when a new puzzle drops (Dec 1-25)
- **Role Mentions** — Optionally ping a Discord role with updates
- **No Session Token Required** — Uses AoC's public read-only leaderboard links
- **Smart Caching** — Respects AoC's API guidelines with intelligent caching

## 🚀 Quick Start

### Using the Hosted Version

1. Get your leaderboard's **read-only link** from [AoC Leaderboards](https://adventofcode.com/leaderboard/private)
2. Create a **Discord webhook** in your server (Server Settings → Integrations → Webhooks)
3. Visit [adventcord.liam.so](https://adventcord.liam.so) and fill out the form
4. Done! You'll receive updates at your scheduled times

### Self-Hosting

#### Prerequisites

- [Bun](https://bun.sh) runtime
- [Turso](https://turso.tech) database (or any libSQL-compatible database)

#### Setup

```bash
# Clone the repository
git clone https://github.com/Lermatroid/adventcord.git
cd adventcord

# Install dependencies
bun install

# Create env file
touch .env
# Edit .env with your Turso credentials

# Push database schema
bun run db:push

# Start development server
bun run dev
```

#### Environment Variables

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## 🏗️ Architecture

| Component | Platform | Description                                    |
| --------- | -------- | ---------------------------------------------- |
| Web App   | Vercel   | Next.js 15 frontend for managing subscriptions |
| Cron Job  | Railway  | Hourly job that sends webhook notifications    |
| Database  | Turso    | SQLite database for storing subscriptions      |

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **Database**: Turso (libSQL) + Drizzle ORM
- **Styling**: Tailwind CSS v4
- **HTTP Client**: @better-fetch/fetch

## 🛠️ Development

```bash
# Run development server
bun run dev

# Run database studio
bun run db:studio

# Generate database migrations
bun run db:generate

# Run cron job manually
bun run cron --help
```

### Cron Debug Commands

```bash
# Test with a specific webhook (from DB)
bun run cron --webhook-url "https://discord.com/api/webhooks/..."

# Dry run (no webhooks sent)
bun run cron --dry-run --force-aoc --day 1

# Test directly without DB
bun run cron --test-url "https://discord.com/api/webhooks/..." --test-leaderboard "https://adventofcode.com/..."
```

## 🚢 Deployment

### Vercel (Web App)

1. Connect your GitHub repository to Vercel
2. Add environment variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
3. Deploy

### Railway (Cron Job)

1. Create a new project and connect your repository
2. Add environment variables
3. Set up a cron job: `0 * * * *` (every hour on the hour)
4. Command: `bun run cron`

## 📄 License

MIT

## 🙏 Acknowledgments

- [Advent of Code](https://adventofcode.com) by Eric Wastl
- Inspired by the AoC terminal aesthetic

---

<p align="center">
  <sub>Not affiliated with Advent of Code. Please support AoC by purchasing <a href="https://adventofcode.com/support">AoC++</a>!</sub>
</p>
