FROM node:18
WORKDIR /main
EXPOSE 3000
COPY . /main
RUN npm install
CMD ["npm", "start"]
