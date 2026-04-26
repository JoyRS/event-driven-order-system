FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm install && npm run build -w @eds/contracts && npm run build -w payment-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm install --omit=dev
COPY --from=build /app/packages/event-contracts/dist ./packages/event-contracts/dist
COPY --from=build /app/apps/payment-service/dist ./apps/payment-service/dist
WORKDIR /app/apps/payment-service
CMD ["node", "dist/main.js"]
