# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY --chown=node:node server.mjs ./server.mjs
RUN chmod +x /docker-entrypoint.sh

COPY --from=build --chown=node:node /app/dist ./dist

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.mjs"]
