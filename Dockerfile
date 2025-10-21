#------------------------------------------------------
# prod dependencies
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev


#------------------------------------------------------
# builder
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json package-lock.json* ./

RUN npm ci --also=dev

COPY . .

RUN npm run build


#------------------------------------------------------
# production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

USER node

COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/build ./build
COPY --chown=node:node package.json ./

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "build/index.js"]