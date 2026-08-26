FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# node:sqlite es "experimental" en Node 24 pero no requiere flag; esto solo
# silencia el ExperimentalWarning en los logs del contenedor.
ENV NODE_OPTIONS=--no-warnings
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# scripts/create-admin.mjs es standalone (solo módulos nativos de Node) —
# se copia aparte porque Next.js no lo incluye en .next/standalone.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Archivo SQLite: vive en un volumen persistente montado en /app/data
# (configurar el volumen en Dokploy) para sobrevivir a redeploys.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
ENV DB_PATH=/app/data/tablero.db
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
