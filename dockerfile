# Use official Node.js image as the base image
FROM node:18.17.1-alpine

# Set the working directory inside the container
WORKDIR /app

RUN apk update \
  && apk add --no-cache wget curl ca-certificates gnupg
  
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (if needed)
EXPOSE 5000

# Command to run your application
CMD ["node", "index.js"]


