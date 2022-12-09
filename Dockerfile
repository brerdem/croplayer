# Dockerfile

# base image
FROM node:alpine

# create & set working directory
RUN mkdir -p /usr/src
WORKDIR /usr/src

# copy source files
COPY . /usr/src

# install dependencies
RUN npm install

#rebuild
RUN npm rebuild --platform=linux --arch=arm64 --libc=musl sharp

# install sharp for linux
#COPY ./sharp-linuxmusl-arm64v8.node /usr/src/node_modules/sharp/build/Release

# start app
RUN npm run build
EXPOSE 3000
CMD npm run start