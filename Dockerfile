FROM node:14 

RUN mkdir -p /app
WORKDIR /app
COPY package*.json /app/
COPY . /app
RUN npm install 
ENV NODE_ENV development
ENV TZ=Asia/Seoul 
CMD ["npm", "start"]
EXPOSE 3000