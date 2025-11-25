RUN chmod -R 755 node_modules/.bin
# Fix prisma permission error 
# Add execute permission on node_modules/.bin before generating prisma
Update Dockerfile: Add chmod permissions after npm install to fix Prisma binary permission error.
Commit directly to main branch.FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate --schema=./prisma/master/master.prisma
RUN npx prisma generate --schema=./prisma/tenant/schema.prisma

RUN npm run build

EXPOSE 4002

CMD ["npm", "run", "start"]
