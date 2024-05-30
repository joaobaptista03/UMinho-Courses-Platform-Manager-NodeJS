FROM node

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT 3124
ENV MONGODB_URI mongodb://mongo:27017/projeto-geradorUCS

EXPOSE 3124

CMD ["npm", "start"]