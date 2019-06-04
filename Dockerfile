FROM node:10.11-alpine

ENV NPM_CONFIG_LOGLEVEL notice
ENV DATABASE_URL postgres://urqxkcucomqdik:bd253d3726c318488b6194380b44c1a30f5d55a89d45a32459ee917300d1d18b@ec2-176-34-184-174.eu-west-1.compute.amazonaws.com:5432/d9s15jo0i53j8l
ENV CLIENT_URL http://18.216.230.185

# Install NPM packages
WORKDIR /app
ADD package*.json ./
RUN npm i
ADD . .

# Build
RUN npm run build
# RUN npm run prod

EXPOSE 3030

CMD npm run prod
