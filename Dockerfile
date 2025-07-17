FROM node:24-slim AS builder
LABEL authors="chaddy"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm nuxt generate
RUN pnpm nuxt generate

FROM nginx:alpine AS base
COPY --from=builder /app/.output/public /usr/share/nginx/html
