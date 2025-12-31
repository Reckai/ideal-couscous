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

# Build API first
RUN pnpm run build --filter=api

# Prepare production bundle using pnpm deploy
RUN pnpm --filter=api deploy --prod /prod/api

# Copy the built dist folder and prisma schema
RUN cp -r /app/apps/api/dist /prod/api/dist
RUN cp -r /app/apps/api/prisma /prod/api/prisma

# Generate Prisma Client in the production bundle
WORKDIR /prod/api
RUN npx prisma generate

# Runner stage
FROM base AS runner
WORKDIR /app

# Copy the standalone production bundle
COPY --from=builder /prod/api .

# Start command
CMD ["node", "dist/main"]