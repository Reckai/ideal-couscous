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

# Generate Prisma Client BEFORE build
# Use dummy DATABASE_URL - prisma generate only needs schema, not actual DB connection
WORKDIR /app/apps/api
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Build API
RUN pnpm run build

# Prepare production bundle using pnpm deploy
WORKDIR /app
RUN pnpm --filter api deploy --prod --legacy /prod/api

# Copy the built dist folder and prisma schema
RUN cp -r /app/apps/api/dist /prod/api/dist
RUN cp -r /app/apps/api/prisma /prod/api/prisma
RUN cp -r /app/apps/api/generated /prod/api/generated

# Runner stage
FROM base AS runner
WORKDIR /app

# Copy the standalone production bundle
COPY --from=builder /prod/api .

# Start command
CMD ["node", "dist/main"]