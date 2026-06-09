# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json .npmrc ./
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY artifacts/car-rental/package.json artifacts/car-rental/package.json
COPY artifacts/mobile/package.json artifacts/mobile/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/db/package.json lib/db/package.json
COPY scripts/package.json scripts/package.json

FROM manifests AS backend-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @workspace/api-server... \
      --filter @workspace/db \
      --filter @workspace/scripts

FROM backend-deps AS backend
COPY artifacts/api-server artifacts/api-server
COPY lib/api-zod lib/api-zod
COPY lib/db lib/db
COPY scripts scripts
RUN pnpm --filter @workspace/api-server run build
ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]

FROM manifests AS frontend-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @workspace/car-rental...

FROM frontend-deps AS frontend-build
COPY artifacts/car-rental artifacts/car-rental
COPY attached_assets attached_assets
COPY lib/api-client-react lib/api-client-react
ENV NODE_ENV=production
ENV PORT=3000
ENV BASE_PATH=/
RUN pnpm --filter @workspace/car-rental run build

FROM nginx:1.27-alpine AS frontend
COPY docker/nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/artifacts/car-rental/dist/public /usr/share/nginx/html
EXPOSE 3000

FROM manifests AS mobile-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @workspace/mobile...

FROM mobile-deps AS mobile
COPY artifacts/mobile artifacts/mobile
COPY lib/api-client-react lib/api-client-react
ENV CI=1
ENV PORT=3003
ENV EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPOSE 3003 8081
CMD ["pnpm", "--filter", "@workspace/mobile", "exec", "expo", "start", "--web", "--host", "lan", "--port", "3003"]
