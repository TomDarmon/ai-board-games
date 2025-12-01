# AI Board Games

A Next.js web application for playing 2-player turn-based games against AI agents with real-time generative UI updates.

## Overview

This project demonstrates how to build interactive generative UI where AI agents take actions and the interface updates in real time. Users can play classic games like Tic-Tac-Toe, Connect Four, and Chess against intelligent AI opponents powered by LLMs.

**Try it live:** [http://agent.leaguelo.com/](http://agent.leaguelo.com/) (or run locally with your own API keys)

### Current Features

- ✅ Three playable games: Tic-Tac-Toe, Connect Four, Chess
- ✅ Real-time game streaming and UI updates
- ✅ User authentication and secure API key management
- ✅ Match history and replay functionality

### In Progress / Planned Features

- ⏳ **Restart Matches** - Allow users to restart or replay matches that have been stopped
- ⏳ **Backend Error Handling** - Display user-friendly notifications when backend errors occur (API key limit reached, rate limits, internal errors, etc.)
- ⏳ **Illegal Move Display** - Show illegal moves in the match history with clear indicators
- ⏳ **Infinite Game Prevention** - Handle infinite chess games through:
  - Move repetition detection
  - Draw by repetition rules (3-fold repetition)
  - 50-move rule implementation
  - Stalemate and insufficient material detection
- ⏳ **Prompt Inspection** - Allow users to view the exact prompts sent to AI agents for move generation
  - View-only prompt display in match replay
  - Inspect token usage and model responses per move

## Getting Started

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
```

**ENCRYPTION_KEY**: Generate a 32-byte key for API key encryption (as base64):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

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

Users can securely store API keys in the dashboard (**Settings > API Keys**):

- **Encrypted Storage**: Keys are encrypted with AES-256-GCM at rest
- **No Server Overhead**: No need to provide API keys at deployment
- **Per-User Keys**: Each user manages their own credentials
- **Validation**: Keys are validated when saved
