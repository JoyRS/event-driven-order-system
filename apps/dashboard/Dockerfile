FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm install && npm run build -w dashboard

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm install --omit=dev
COPY --from=build /app/apps/dashboard/.next ./apps/dashboard/.next
WORKDIR /app/apps/dashboard
CMD ["npm", "run", "start"]
