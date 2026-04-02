FROM node:18-alpine AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run generate

FROM node:18-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY skills/ ./skills/
COPY configs/config.example.yaml ./configs/config.example.yaml

COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

RUN mkdir -p data/static

ENV PORT=5679
EXPOSE 5679

CMD ["npx", "--prefix", "backend", "tsx", "src/index.ts"]
