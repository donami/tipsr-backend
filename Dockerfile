FROM node:10.11-alpine

ENV NPM_CONFIG_LOGLEVEL notice
ENV DATABASE_URL postgresql://donami:Nu7XX7TqUCqyNPlDgbdk@spotmovie.cxcuwe3zi32g.us-east-2.rds.amazonaws.com/spotmovie
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
