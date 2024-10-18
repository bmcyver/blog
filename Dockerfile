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

FROM nginx:alpine AS runtime

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80