# Base setup
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm run db:generate

# Build API
RUN pnpm run build --filter=api

# Prepare production bundle using pnpm deploy
# This creates a folder with the package and its production dependencies isolated
RUN pnpm --filter=api deploy --prod /prod/api

# Copy the built dist folder (since deploy excludes gitignored files)
COPY apps/api/dist /prod/api/dist
COPY apps/api/prisma /prod/api/prisma

# Runner stage
FROM base AS runner
WORKDIR /app

# Copy the standalone production bundle
COPY --from=builder /prod/api .

# Start command
CMD ["node", "dist/main"]