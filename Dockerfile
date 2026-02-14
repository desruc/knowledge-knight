# Build layer
FROM node:lts-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN mkdir -p /usr/knowledge-knight-src/
WORKDIR /usr/knowledge-knight-src/
COPY package.json pnpm-lock.yaml /usr/knowledge-knight-src/
RUN pnpm install --frozen-lockfile
COPY . /usr/knowledge-knight-src/
RUN pnpm run build

# Image layer
FROM node:lts-alpine

ARG DISCORD_TOKEN
ARG DB_URL
ARG CLIENT_ID
ARG TZ

ENV DISCORD_TOKEN=${DISCORD_TOKEN}
ENV DB_URL=${DB_URL}
ENV CLIENT_ID=${CLIENT_ID}
ENV TZ=${TZ}

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN mkdir -p /usr/knowledge-knight
WORKDIR /usr/knowledge-knight
COPY package.json pnpm-lock.yaml /usr/knowledge-knight/
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /usr/knowledge-knight-src/dist /usr/knowledge-knight

CMD ["pnpm", "run", "start:prod"]
