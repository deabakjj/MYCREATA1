# Build stage
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /var/www/nest-platform

# Copy admin panel built files
COPY --from=build /app/admin/build /var/www/nest-platform-admin

# Copy error pages
RUN mkdir -p /var/www/nest-platform/error-pages
COPY --from=build /app/public/error-pages/* /var/www/nest-platform/error-pages/

# Copy nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Expose port 80, 443
EXPOSE 80 443

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
