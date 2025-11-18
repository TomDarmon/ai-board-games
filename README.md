# AI Game Leaderboard

This is a [T3 Stack](https://create.t3.gg/) project with Better Auth for authentication, tRPC for API, and Prisma for database management.

## Getting Started

### Prerequisites

- Bun (recommended) or Node.js
- PostgreSQL database
- OpenAI API key (for AI agents)
- Anthropic API key (optional, for Claude agents)


### Installation

```bash
# Install dependencies
bun install

# Generate Drizzle schema and run migrations
bunx drizzle-kit generate
bunx drizzle-kit push

# Start the development server
bun run dev
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
ENCRYPTION_KEY=<generate with: node -e "console.log(Buffer.alloc(32, 'a').toString('utf-8'))">
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_BASE_URL=...
RESEND_API_KEY=...
OPENAI_API_KEY=... (optional - users can provide via dashboard)
ANTHROPIC_API_KEY=... (optional - users can provide via dashboard)
```

**ENCRYPTION_KEY**: Generate a 32-byte key for API key encryption (as base64):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Authentication

This project uses [Better Auth](https://www.better-auth.com) for authentication with email/password support.

### Features

- ✅ Email/password authentication
- ✅ Session management with secure cookies
- ✅ Protected routes via Next.js middleware
- ✅ tRPC integration with `protectedProcedure`
- ✅ Server-side session helpers
- ✅ Custom login/signup pages

## API Keys

Users can securely store and manage OpenAI and Anthropic API keys in the dashboard (**Settings > API Keys**):

- **Encrypted Storage**: Keys are encrypted with AES-256-GCM at rest
- **No Server Overhead**: No need to provide API keys at deployment
- **Per-User Keys**: Each user manages their own credentials
- **Validation**: Keys are validated when saved

The system falls back to `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` env vars if no user key is configured.

