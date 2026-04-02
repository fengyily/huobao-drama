FROM node:22-alpine AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run generate

FROM node:22-alpine AS backend-builder

WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/ ./
RUN npx tsc

FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY --from=backend-builder /build/backend/dist ./backend/dist
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist
COPY skills/ ./skills/
COPY configs/config.example.yaml ./configs/config.example.yaml

RUN mkdir -p data/static

ENV NODE_ENV=production
ENV PORT=5679
EXPOSE 5679

CMD ["node", "backend/dist/index.js"]
