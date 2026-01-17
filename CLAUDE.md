# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anime Tinder is a real-time collaborative anime selection app using swipe mechanics (like Tinder). Two users create/join a room, select anime titles, swipe together via WebSocket, and find matches.

**Tech Stack:**
- Frontend: Vite + React 19 (TypeScript, Tailwind CSS v4, React Router DOM)
- State Management: Reatom
- Backend: NestJS 10 (TypeScript, WebSocket with Socket.io)
- Database: PostgreSQL with Prisma ORM
- Cache/Real-time State: Redis (ioredis)
- Task Queue: BullMQ
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
npm run dev:web                      # Vite dev server (http://localhost:3000)
npm run dev:api                      # NestJS only (http://localhost:3001)
```

### Docker Infrastructure
```bash
npm run docker:dev                   # Start PostgreSQL + Redis + Redis Commander
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
npm run lint                         # Lint all workspaces
npm run typecheck                    # Type check web and api
```

## Architecture

### Monorepo Structure
```
/
├── apps/
│   ├── web/                         # Vite + React frontend
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI components
│   │   │   │   ├── ui/              # shadcn/ui components
│   │   │   │   ├── room/            # Room-related components
│   │   │   │   └── layout/          # Layout components
│   │   │   ├── pages/               # Page components
│   │   │   │   ├── Room/            # Room pages
│   │   │   │   │   ├── AnimeSelect/ # Anime selection page
│   │   │   │   │   └── components/  # Room sub-components
│   │   │   │   └── Home.tsx
│   │   │   ├── models/              # Reatom state models
│   │   │   ├── providers/           # Context providers (Socket, Theme)
│   │   │   ├── lib/                 # Utilities
│   │   │   └── router.tsx           # React Router configuration
│   │   └── vite.config.ts
│   └── api/                         # NestJS backend
│       ├── src/
│       │   ├── config/              # Configuration & validation
│       │   ├── Prisma/              # Prisma service (global module)
│       │   ├── redis/               # Redis service (global module)
│       │   ├── room/                # Room management (repositories only)
│       │   │   ├── repositories/    # Data access layer
│       │   │   │   ├── room.repository.ts         # PostgreSQL operations
│       │   │   │   └── room-cache.repository.ts   # Redis operations
│       │   │   └── services/
│       │   │       └── disconnectTime.service.ts  # Disconnect timer
│       │   ├── matching/            # Real-time matching (WebSocket)
│       │   │   ├── repositories/
│       │   │   │   └── matching-cache.repository.ts
│       │   │   ├── dto/
│       │   │   ├── matching.service.ts   # Business logic
│       │   │   └── matching.gateway.ts   # WebSocket gateway
│       │   ├── media/               # Media/Anime catalog
│       │   │   ├── adapters/
│       │   │   │   └── tmdbAdapter/ # TMDB API integration
│       │   │   ├── repositories/
│       │   │   ├── media.service.ts
│       │   │   ├── media.controller.ts
│       │   │   ├── media.processor.ts    # BullMQ processor
│       │   │   └── media.sheduler.ts     # Scheduled tasks
│       │   ├── user/                # User management
│       │   │   ├── user.service.ts
│       │   │   └── user.repository.ts
│       │   └── common/              # Shared utilities
│       │       ├── adapters/        # Redis adapter for Socket.io
│       │       ├── decorators/      # Custom decorators
│       │       └── guards/          # Auth guards
│       ├── prisma/
│       │   └── schema.prisma        # Prisma schema (source of truth)
│       └── generated/prisma/        # Generated Prisma Client
└── packages/
    └── shared/                      # Shared types between frontend and backend
        └── src/
            ├── index.ts
            └── socket/events.ts     # WebSocket event types
```

### Data Layer Pattern

The codebase uses a **Repository Pattern with dual storage**:

1. **PostgreSQL (via Prisma)** = Source of truth for persistent data
   - `RoomRepository` (apps/api/src/room/repositories/room.repository.ts)
   - `MediaRepository` (apps/api/src/media/repositories/media.repository.ts)
   - `UserRepository` (apps/api/src/user/user.repository.ts)
   - Handles: rooms, users, media, matches

2. **Redis (via ioredis)** = Hot cache for real-time state
   - `RoomCacheRepository` (apps/api/src/room/repositories/room-cache.repository.ts)
   - `MatchingCacheRepository` (apps/api/src/matching/repositories/matching-cache.repository.ts)
   - Handles: room state, user selections, media pools, swipes
   - TTL: 30 minutes for room data

**Key Principle:** Services orchestrate both repositories. Write to PostgreSQL for durability, write to Redis for real-time state. Redis data expires automatically.

### Frontend State Management (Reatom)

The frontend uses Reatom for state management:
- `apps/web/src/models/room.model.ts` - Room state
- `apps/web/src/pages/Room/AnimeSelect/animeSelect.model.ts` - Anime selection state

Key patterns:
- `atom()` for state
- `action()` for mutations
- `effect()` for side effects
- `reatomComponent()` for connected components

### Room Flow State Machine

```
WAITING → SELECTING → READY → SWIPING → MATCHED
   ↓          ↓         ↓        ↓         ↓
CANCELLED (any state)
```

**State Transitions:**
- `WAITING`: Host created room, waiting for guest (max 2 users)
- `SELECTING`: Host started selection, both users choosing anime
- `READY`: Both submitted selections, media pool created
- `SWIPING`: Both users ready, actively swiping
- `MATCHED`: Found a match
- `CANCELLED`: User left room

### Redis Key Patterns

Located in `RoomCacheRepository`:
```
room:{roomId}:state                    # Hash: status, hostId, etc.
room:{roomId}:users                    # Hash: userId → userName
room:{roomId}:user:{userId}:selections # Set: mediaIds selected by user
room:{roomId}:media_pool               # List: combined media for swiping
room:{roomId}:swipes                   # Hash: {userId}:{mediaId} → LIKE/SKIP
user:{userId}:room                     # String: current roomId
```

### WebSocket Events

Namespace: `/matching`

**Client → Server:**
- `create_room` - Create new room
- `join_room` - Join existing room by inviteCode
- `leave_room` - Leave current room
- `start_selecting` - Host starts selection phase
- `add_anime` - Add anime to user's draft
- `remove_media_from_draft` - Remove anime from draft

**Server → Client:**
- `connection_established` - New user connected with userId
- `sync_state` - Full room state sync
- `try_to_join` - Prompt user to join/create room
- `user_joined` - Another user joined
- `user_left` - Another user left
- `error_leave` - Error occurred

## Database Schema

Key models (apps/api/prisma/schema.prisma):

- **User**: id, name (optional), isAnonymous (default true)
- **Room**: id, inviteCode (unique), status (enum), hostId, guestId, preferences (JSON), expiresAt
- **Media**: id, title, posterPath, tmdbId (unique), TMDBLink
- **RoomMatch**: id, roomId (unique, one-to-one), mediaId, matchedAt

**Important:** Prisma Client is generated to `apps/api/generated/prisma/` (see schema.prisma output path). Import as `generated/prisma`.

## Environment Configuration

Root `.env` file contains:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Docker PostgreSQL
- `TMDB_API_KEY`: TMDB API key for fetching anime/movies
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `VITE_BACKEND_URL`: Backend API URL for frontend

Configuration loaded via `@nestjs/config` (apps/api/src/config/configutation.ts).

## Key Implementation Notes

### Matching Service Orchestration

The `MatchingService` (apps/api/src/matching/matching.service.ts) handles all room logic:

1. **Create Room**: Generate invite code → Init Redis state
2. **Join Room**: Validate room exists → Check capacity (max 2) → Add user
3. **Start Selecting**: Validate host → Check user count → Update status
4. **Add/Remove Anime**: Validate membership → Save to Redis draft
5. **Process Swipe**: Validate SWIPING state → Save swipe → Check for match

**Note:** Room controller was removed. All room operations go through WebSocket gateway.

### Media Module

The media module handles anime/movie catalog:
- `TmdbAdapter`: Fetches data from TMDB API
- `MediaProcessor`: BullMQ processor for async media sync
- `MediaScheduler`: Scheduled jobs for periodic sync
- `MediaService`: CRUD operations with cursor pagination
- `MediaController`: REST endpoints (`GET /api/media`, `POST /api/media/batch`)

### Anonymous Users

MVP uses anonymous users:
- Users get UUID on first WebSocket connection
- UserID stored in cookie (`user-session`) or passed via socket.auth
- No registration required

### Disconnect Handling

`DisconnectTimerService` handles graceful disconnects:
- Sets timer on disconnect
- Clears timer on reconnect
- Removes user from room after timeout

### Error Handling

NestJS uses exception filters. Common patterns:
- `NotFoundException`: Resource not found (404)
- `BadRequestException`: Invalid input/state (400)
- `WsException`: WebSocket errors

### Module Dependencies

- `PrismaModule`: Global module, exports `PrismaService`
- `RedisModule`: Global module, exports `RedisService`
- `RoomModule`: Exports repositories and `DisconnectTimerService`
- `MatchingModule`: Depends on `RoomModule`, handles WebSocket
- `MediaModule`: Independent, handles media catalog
- `UserModule`: User management

## Development Workflow

1. **Local Development**: Only PostgreSQL + Redis run in Docker. Apps run natively for fast HMR.
2. **Database Changes**:
   - Edit `apps/api/prisma/schema.prisma`
   - Run `npm run db:migrate` to create migration
   - Generated client updates automatically in `apps/api/generated/prisma/`
3. **Redis State**: Auto-expires after 30 minutes. Use `npm run redis:flush` to clear manually during development.
4. **Shared Types**: Edit `packages/shared/src/` for types used by both frontend and backend.

## Common Gotchas

- **Prisma Client Import**: Use `import { ... } from 'generated/prisma'`, NOT `@prisma/client`
- **Redis Password**: Always required in dev (`devredispass`). See docker-compose.dev.yml.
- **Room TTL Mismatch**: PostgreSQL expires in 24h, Redis in 30min. This is intentional - Redis is hot cache only.
- **No Room Controller**: All room operations go through WebSocket gateway, not REST.
- **Windows Compatibility**: Use npm scripts, not Makefile commands.
- **Frontend Routing**: Uses react-router-dom, not Next.js App Router.
- **State Management**: Uses Reatom, not Redux or Context.

## Project Context

This is an MVP-first approach:
- **NOT microservices** - modular monolith until >5000 users
- **Redis required from day 1** - for WebSocket Pub/Sub and session management
- **PostgreSQL = source of truth** - Redis is ephemeral state only
- **TMDB integration** - fetches anime/movies from TMDB API
- **Anonymous users** - no registration for MVP, just UUIDs

See Context.md and DOCKER_SETUP.md for additional architectural decisions and Docker troubleshooting.
