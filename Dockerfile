# Base image: Node LTS
FROM node:20.4.0-alpine

# Install PNPM
RUN npm install -g pnpm

# Create application directory and move there
WORKDIR /app

# Copy package.json and pnpm-lock.yaml from the host to the container
COPY package.json pnpm-lock.yaml ./

# Copy scripts and locales
COPY scripts ./scripts
COPY locales ./locales
# used to store the _locales file
RUN mkdir -p src/i18n

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the app
RUN pnpm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
