# Stage 1: Build the React Application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# ---

# Stage 2: Serve the application with Apache
FROM httpd:2.4-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/build /usr/local/apache2/htdocs/

# Copy the .htaccess file for SPA routing
COPY --from=builder /app/src/.htaccess /usr/local/apache2/htdocs/

# 1. Enable SSL modules in the Apache configuration
RUN sed -i \
    -e 's/#LoadModule ssl_module/LoadModule ssl_module/' \
    -e 's/#LoadModule socache_shmcb_module/LoadModule socache_shmcb_module/' \
    -e 's/#Include conf\/extra\/httpd-ssl.conf/Include conf\/extra\/httpd-ssl.conf/' \
    /usr/local/apache2/conf/httpd.conf

# Generate a self-signed SSL certificate	
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /usr/local/apache2/conf/server.key \
    -out /usr/local/apache2/conf/server.crt \
    -subj "/C=US/ST=California/L=SanFrancisco/O=MyCompany/OU=MyOrg/CN=localhost"

# 3. Permanent redirect from HTTP to HTTPS
RUN echo "\n<VirtualHost *:80>\n  ServerName localhost\n  Redirect permanent / https://localhost/\n</VirtualHost>" >> /usr/local/apache2/conf/httpd.conf

# Expose port 443 for the web server
EXPOSE 443

# Start Apache in the foreground
CMD ["httpd-foreground"]