FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with better error handling
RUN npm install --legacy-peer-deps || npm install --force

# Copy source code
COPY . .

# Set environment for development
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start in development mode to avoid build issues
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]