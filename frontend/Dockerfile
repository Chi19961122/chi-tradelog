# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

# API 基底 URL 於 build 時注入（Vite 會把 import.meta.env 內嵌進產物）
ARG VITE_API_BASE_URL=http://localhost:5079
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
