# ── Stage 1: Build React client ───────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

COPY client/ ./client/
RUN npm run build --workspace client

# ── Stage 2: Build Express server ─────────────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

COPY server/ ./server/
RUN npm run prisma:generate --workspace server
RUN npm run build --workspace server

# ── Stage 3: Production ───────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

# Copy Prisma schema + migrations (needed at runtime for migrate deploy)
COPY server/prisma ./server/prisma
# Generate Prisma client against the production schema
RUN npm run prisma:generate --workspace server

# Copy compiled server
COPY --from=server-build /app/server/dist ./server/dist

# Copy React build into server/public (Express will serve it as static files)
COPY --from=client-build /app/client/dist ./server/public

EXPOSE 8080

WORKDIR /app/server

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
