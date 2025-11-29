FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npm cache clean --force

COPY . .

# Fix permissions and generate Prisma client for both schemas
RUN chmod -R +x /app/node_modules/.bin/ && \
    npx prisma generate --schema=prisma/tenant/schema.prisma

EXPOSE 4002

# Use npm run dev which has the correct ts-node-dev command
CMD ["npm", "run", "dev"]
