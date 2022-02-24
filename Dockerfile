FROM node:16

RUN mkdir -p /app
WORKDIR /app
COPY package*.json /app/
RUN npm install 
COPY . /app
EXPOSE 3000
ENV NODE_ENV development
ENV TZ=Asia/Seoul 
CMD ["npm", "start"]