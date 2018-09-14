FROM node

# Create app directory
RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/
COPY yarn.lock /app/

RUN yarn install

COPY . /app/

# start command
CMD [ "node", "./index.js" ]