FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/listener/package.json apps/listener/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/discord/package.json packages/discord/package.json
COPY packages/solana/package.json packages/solana/package.json
COPY packages/telegram/package.json packages/telegram/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN pnpm install --filter @repo/db... --frozen-lockfile --prod=false

COPY . .

CMD ["pnpm", "--filter", "@repo/db", "db:migrate"]
