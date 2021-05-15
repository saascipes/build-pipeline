FROM node:10 as api

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY postinstall.sh ./
COPY server/package*.json ./server/
COPY clientv1/package*.json ./clientv1/
COPY config/. ./config/

ENV NODE_ENV production

# RUN npm install
# If you are building your code for production
RUN npm ci --only=production

# Bundle app source
COPY ./ .

EXPOSE 3000
CMD [ "node", "server/dist/api/StartServer.js" ]


FROM nginx as client
RUN mkdir /app
COPY --from=api /app/clientv1/dist /app
COPY nginx.conf /etc/nginx/nginx.conf

ENV NODE_ENV production

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]