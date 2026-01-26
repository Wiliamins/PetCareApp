# PetCareApp - Frontend Dockerfile
# @author VS

# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Kopiowanie package.json - VS
COPY package*.json ./
RUN npm ci

# Kopiowanie źródeł i build - VS
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Kopiowanie builda - VS
COPY --from=build /app/build /usr/share/nginx/html

# Kopiowanie konfiguracji nginx - VS
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
