FROM node

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

ENV PORT 3123

EXPOSE 3123

CMD ["npm", "start"]