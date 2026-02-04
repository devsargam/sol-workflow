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

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter listener... build

FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/listener/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages

CMD ["node", "dist/index.js"]
