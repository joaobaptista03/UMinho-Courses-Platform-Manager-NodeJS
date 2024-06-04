FROM node

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

ENV PORT 3124

EXPOSE 3124

CMD ["npm", "start"]