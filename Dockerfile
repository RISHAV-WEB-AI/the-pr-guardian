# Base image for our verifiable tests
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies (only required test libraries if applicable)
RUN npm install

# Create a secure non-root user for executing untrusted PR code
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# The entrypoint will simply wait for our CI/CD runner to pipe the generated verification scripts to it
CMD ["sh", "-c", "echo 'Sandbox Ready'; sleep infinity"]
