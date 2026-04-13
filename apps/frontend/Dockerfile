FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first (cached layer)
COPY package*.json ./

RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite development server with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
