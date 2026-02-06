FROM node:20-bullseye-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

ENV HUSKY=0

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOLANA_RPC_URL
ARG NEXT_PUBLIC_SOLANA_NETWORK
ARG NEXT_PUBLIC_PRIVY_APP_ID

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOLANA_RPC_URL=${NEXT_PUBLIC_SOLANA_RPC_URL}
ENV NEXT_PUBLIC_SOLANA_NETWORK=${NEXT_PUBLIC_SOLANA_NETWORK}
ENV NEXT_PUBLIC_PRIVY_APP_ID=${NEXT_PUBLIC_PRIVY_APP_ID}

RUN pnpm install --frozen-lockfile --ignore-scripts --prod=false
RUN pnpm --filter web... build

FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy the standalone build (includes all dependencies bundled)
COPY --from=build /app/apps/web/.next/standalone ./
# Copy static assets
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
# Copy public folder
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000

# Use the standalone server
CMD ["node", "apps/web/server.js"]
