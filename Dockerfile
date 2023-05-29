# Base image: Node LTS
FROM node:lts-alpine

# Create application directory and move there
WORKDIR /app

# Copy package.json and package-lock.json from the host to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
