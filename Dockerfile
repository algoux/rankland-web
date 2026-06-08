FROM algoux/nodebase:20

WORKDIR /app/

COPY package.json pnpm-lock.yaml ./
COPY node_modules ./node_modules
COPY app ./app
COPY dist ./dist
COPY public ./public

ENV NODE_ENV=production
CMD node --unhandled-rejections=warn app/server/index.js
