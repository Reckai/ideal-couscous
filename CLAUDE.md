# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Netflix Tinder is a real-time collaborative movie/series selection app using swipe mechanics (like Tinder). Two users create/join a room, select content, swipe together via WebSocket, and find matches.

**Tech Stack:**
- Frontend: Next.js 16 (React 19, TypeScript, Tailwind CSS v4)
- Backend: NestJS 10 (TypeScript, WebSocket with Socket.io)
- Database: PostgreSQL with Prisma ORM
- Cache/Real-time State: Redis (ioredis)
- Monorepo: npm workspaces (no Turborepo/Nx)

## Development Commands

### Initial Setup
```bash
npm install                           # Install all workspace dependencies
npm run setup                         # Full setup: install + docker + migrations
```

### Development
```bash
npm run dev                          # Start Docker + both apps concurrently
npm run dev:web                      # Next.js only (http://localhost:3000)
npm run dev:api                      # NestJS only (http://localhost:3001)
```

### Docker Infrastructure
```bash
npm run docker:dev                   # Start PostgreSQL + Redis
npm run docker:down                  # Stop containers
npm run docker:restart               # Restart containers
npm run docker:logs                  # View logs
npm run docker:status                # Check container status
npm run docker:tools                 # Start pgAdmin + Redis Commander
npm run docker:clean                 # Delete all volumes (destructive!)
```

### Database (Prisma)
```bash
npm run db:migrate                   # Run migrations (apps/api)
npm run db:reset                     # Reset database (destructive!)
npm run db:studio                    # Open Prisma Studio GUI
npm run db:generate                  # Generate Prisma Client
npm run db:seed                      # Seed database
```

### Redis
```bash
npm run redis:cli                    # Connect to Redis CLI
npm run redis:flush                  # Clear all Redis data (destructive!)
```

### Testing & Linting
```bash
cd apps/api && npm run test          # Run API tests
cd apps/api && npm run test:e2e      # Run e2e tests
cd apps/web && npm run lint          # Lint frontend
cd apps/api && npm run lint          # Lint backend
```

## Architecture

### Monorepo Structure
```
/
├── apps/
│   ├── web/                         # Next.js frontend (App Router)
│   └── api/                         # NestJS backend
│       ├── src/
│       │   ├── config/              # Configuration & validation
│       │   ├── Prisma/              # Prisma service (global module)
│       │   ├── redis/               # Redis service (global module)
│       │   ├── room/                # Room management (REST)
│       │   │   ├── repositories/    # Data access layer
│       │   │   │   ├── room.repository.ts         # PostgreSQL operations
│       │   │   │   └── room-cache.repository.ts   # Redis operations
│       │   │   ├── dto/             # Request/Response DTOs
│       │   │   ├── room.service.ts  # Business logic
│       │   │   └── room.controller.ts
│       │   └── matching/            # Real-time matching (WebSocket)
│       │       ├── repositories/
│       │       │   └── matching-cache.repository.ts
│       │       ├── dto/
│       │       ├── matching.service.ts
│       │       └── matching.gateway.ts
│       ├── prisma/
│       │   └── schema.prisma        # Prisma schema (source of truth)
│       └── generated/prisma/        # Generated Prisma Client
└── packages/
    └── shared/                      # Shared types (planned, not yet used)
```

### Data Layer Pattern

The codebase uses a **Repository Pattern with dual storage**:

1. **PostgreSQL (via Prisma)** = Source of truth for persistent data
   - `RoomRepository` (apps/api/src/room/repositories/room.repository.ts)
   - Handles: rooms, users, matches

2. **Redis (via ioredis)** = Hot cache for real-time state
   - `RoomCacheRepository` (apps/api/src/room/repositories/room-cache.repository.ts)
   - `MatchingCacheRepository` (apps/api/src/matching/repositories/matching-cache.repository.ts)
   - Handles: room state, user selections, media pools, swipes
   - TTL: 30 minutes for room data

**Key Principle:** Services orchestrate both repositories. Write to PostgreSQL for durability, write to Redis for real-time state. Redis data expires automatically.

### Room Flow State Machine

```
WAITING → SELECTING → READY → SWIPING → MATCHED
   ↓          ↓         ↓        ↓         ↓
EXPIRED or CANCELLED (any state)
```

**State Transitions:**
- `WAITING`: Host created room, waiting for guest
- `SELECTING`: Guest joined, both selecting movies
- `READY`: Both submitted selections, media pool created
- `SWIPING`: Both users ready, actively swiping
- `MATCHED`: Found a match
- `EXPIRED`: TTL expired (24h PostgreSQL, 30min Redis)
- `CANCELLED`: User left room

### Redis Key Patterns

Located in `RoomCacheRepository.KEYS`:
```
room:{roomId}:state                    # Hash: status, hostReady, guestReady, currentMediaIndex
room:{roomId}:user:{userId}:selections # Set: mediaIds selected by user
room:{roomId}:media_pool               # List: combined media for swiping
room:{roomId}:swipes                   # Hash: {userId}:{mediaId} → LIKE/SKIP
```

### WebSocket Events

Matching gateway (apps/api/src/matching/matching.gateway.ts):
- `swipe`: User swipes on media (body: `SwipesDto`)
- `events`: Generic event handler (testing)

## Database Schema

Key models (apps/api/prisma/schema.prisma):

- **User**: id, name (unique), passwordHash, hosted/guest rooms
- **Room**: id, inviteCode (unique), status (enum), hostId, guestId, preferences (JSON), expiresAt
- **Media**: id, title, posterPath, tmdbId, TMDBLink
- **RoomMatch**: id, roomId (unique, one-to-one), mediaId, matchedAt

**Important:** Prisma Client is generated to `apps/api/generated/prisma/` (see schema.prisma output path). Import as `generated/prisma`.

## Environment Configuration

Root `.env` file contains:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Docker PostgreSQL
- `JWT_SECRET`, `JWT_EXPIRES_IN`: Auth (planned)
- `TMDB_API_KEY`: Optional, not yet implemented

Configuration loaded via `@nestjs/config` (apps/api/src/config/configutation.ts).

## Key Implementation Notes

### Room Service Orchestration

The `RoomService` (apps/api/src/room/room.service.ts) follows this pattern:

1. **Create Room**: PostgreSQL → Redis state initialization
2. **Join Room**: Update PostgreSQL guest → Update Redis state
3. **Submit Selections**: Store in Redis → Check if both ready → Create media pool → Update status
4. **Start Swiping**: Validate readiness in Redis → Update both PostgreSQL & Redis status

**Always sync state between PostgreSQL and Redis for status changes.**

### Media Pool Logic

When both users submit selections (apps/api/src/room/room.service.ts:364-383):
1. Find intersection (both selected)
2. Find unique selections for each user
3. Shuffle unique selections
4. Final pool: `[...intersection, ...shuffledUnique]` (matches first, then unique)

### Error Handling

NestJS uses exception filters. Common patterns:
- `NotFoundException`: Resource not found (404)
- `ConflictException`: Business rule violation (409)
- `ForbiddenException`: Access denied (403)
- `BadRequestException`: Invalid input (400)

### Module Dependencies

- `PrismaModule`: Global module, exports `PrismaService`
- `RedisModule`: Global module, exports `RedisService`
- `RoomModule`: Imports repositories, exports `RoomService`
- `MatchingModule`: Depends on `RoomModule` repositories

When adding new features, check if services need to be added to module `providers` and `exports`.

## Development Workflow

1. **Local Development**: Only PostgreSQL + Redis run in Docker. Apps run natively for fast HMR.
2. **Database Changes**:
   - Edit `apps/api/prisma/schema.prisma`
   - Run `npm run db:migrate` to create migration
   - Generated client updates automatically in `apps/api/generated/prisma/`
3. **Redis State**: Auto-expires after 30 minutes. Use `npm run redis:flush` to clear manually during development.
4. **Migrations**: Located in `apps/api/prisma/migrations/`. Never edit manually, use `prisma migrate dev`.

## Common Gotchas

- **Prisma Client Import**: Use `import { ... } from 'generated/prisma'`, NOT `@prisma/client`
- **Redis Password**: Always required in dev (`devredispass`). See docker-compose.dev.yml.
- **Room TTL Mismatch**: PostgreSQL expires in 24h, Redis in 30min. This is intentional - Redis is hot cache only.
- **WebSocket Connection**: Not yet fully implemented in matching.gateway.ts (service calls missing).
- **Windows Compatibility**: Use npm scripts, not Makefile commands.

## Project Context

This is an MVP-first approach:
- **NOT microservices** - modular monolith until >5000 users
- **Redis required from day 1** - for WebSocket Pub/Sub and session management
- **PostgreSQL = source of truth** - Redis is ephemeral state only
- **No TMDB integration yet** - users input titles manually for MVP
- **CDN planned** - Cloudflare for movie posters (not implemented)

See Context.md and DOCKER_SETUP.md for additional architectural decisions and Docker troubleshooting.
