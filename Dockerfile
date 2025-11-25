FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate --schema=./prisma/master/master.prisma
RUN npx prisma generate --schema=./prisma/tenant/schema.prisma

RUN npm run build

EXPOSE 4002

CMD ["npm", "run", "start"]
