# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for Mastra backend
COPY src/mastra ./src/mastra
COPY src/lib ./src/lib
COPY tsconfig.json tsconfig.node.json ./

# Build Mastra
RUN pnpm run mastra:build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built output from .mastra/output
COPY --from=builder /app/.mastra/output ./

# Install production dependencies
RUN pnpm install --prod

# Expose port (Railway will override with PORT env var)
EXPOSE 4111

# Start command
CMD ["node", "--import=./instrumentation.mjs", "--import=@opentelemetry/instrumentation/hook.mjs", "./index.mjs"]
