# Base image: Node LTS
FROM node:24-alpine

# Install PNPM
RUN corepack enable

# Create application directory and move there
WORKDIR /app

# Copy the package manifest, lockfile and pnpm settings from the host to the container
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

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
