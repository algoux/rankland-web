FROM algoux/nodebase:16

WORKDIR /app

RUN npm install -g pnpm@^8.0.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

CMD npm run deploy
