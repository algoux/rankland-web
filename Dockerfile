FROM algoux/nodebase:22.23.4

RUN node -e "const assert = require('node:assert/strict'); assert.equal(process.versions.node, '22.23.4'); assert.equal(typeof require('node:zlib').constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH, 'number')"

WORKDIR /app/

COPY package.json pnpm-lock.yaml ./
COPY node_modules ./node_modules
COPY app ./app
COPY dist ./dist
COPY public ./public

ENV NODE_ENV=production
CMD node --unhandled-rejections=warn app/server/index.js
