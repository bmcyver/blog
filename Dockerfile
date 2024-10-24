FROM node:18-alpine AS base

WORKDIR /app
RUN npm install -g pnpm

FROM base AS dependencies

COPY package*.json ./
RUN pnpm install

FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS production

COPY --from=build /app/dist ./dist

EXPOSE 80
CMD ["node", "dist/server/entry.js"]