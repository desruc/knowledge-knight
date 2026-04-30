# Build layer
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /usr/knowledge-knight-src
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Image layer
FROM node:22-alpine

# Runtime env vars (DISCORD_TOKEN, DB_URL, CLIENT_ID, TZ) are supplied at
# `docker run` time. We deliberately don't bake them into the image so the
# published artifact contains no secrets.
ENV NODE_ENV=production

RUN corepack enable

# Run as the unprivileged `node` user that ships with the base image. We use
# /home/node/app so the node user owns its workdir and pnpm's per-user store
# without any chown gymnastics.
USER node
WORKDIR /home/node/app

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build --chown=node:node /usr/knowledge-knight-src/dist ./

CMD ["node", "--require", "module-alias/register", "index.js"]
