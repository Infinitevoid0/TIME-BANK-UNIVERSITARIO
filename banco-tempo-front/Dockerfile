# Multi-stage Dockerfile for React + Vite Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build app
COPY . .
ARG VITE_API_URL=http://localhost:5067/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Nginx production stage
FROM nginx:alpine AS final

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
