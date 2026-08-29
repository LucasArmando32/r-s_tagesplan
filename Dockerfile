FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js inlina las variables NEXT_PUBLIC_* en el bundle del cliente en
# tiempo de build, así que deben llegar como build args (configurarlos en
# Dokploy como "Build Args", no solo como variables de entorno runtime).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# scripts/create-admin.mjs NO se copia aquí: solo habla con la API HTTP de
# Supabase, así que se ejecuta desde una máquina local (`npm run
# create-admin`) apuntando a las credenciales de producción, sin necesidad
# de entrar al contenedor.

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
