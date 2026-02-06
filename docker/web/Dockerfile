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

RUN pnpm install --frozen-lockfile --ignore-scripts
# Provide build-time fallbacks so Next build doesn't fail when Coolify build args are empty.
RUN NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.solworkflow.com}" \
    NEXT_PUBLIC_SOLANA_RPC_URL="${NEXT_PUBLIC_SOLANA_RPC_URL:-https://api.devnet.solana.com}" \
    NEXT_PUBLIC_SOLANA_NETWORK="${NEXT_PUBLIC_SOLANA_NETWORK:-devnet}" \
    NEXT_PUBLIC_PRIVY_APP_ID="${NEXT_PUBLIC_PRIVY_APP_ID:-missing_privy_app_id}" \
    pnpm --filter web... build

FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
