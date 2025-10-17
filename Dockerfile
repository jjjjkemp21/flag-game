# swag instagram
# Stage 1: Build the React Application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---

# Stage 2: Serve the application with Apache (HTTP only)
FROM httpd:2.4-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/build /usr/local/apache2/htdocs/

# Copy the .htaccess file for SPA routing
COPY --from=builder /app/src/.htaccess /usr/local/apache2/htdocs/

# Expose port 80 for the web server
EXPOSE 80

# Start Apache in the foreground
CMD ["httpd-foreground"]