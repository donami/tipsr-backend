import Koa from 'koa';
import { ApolloServer } from 'apollo-server-koa';
// import cors from 'cors';
import jwt from 'jsonwebtoken';

import { resolvers } from './data/resolvers';
import { typeDefs } from './data/schema';

const JWT_SECRET_KEY = 'secret';

const port = process.env.PORT || 3030;

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.

const getUser = async token => {
  if (!token) {
    return null;
  }

  let decoded = null;
  try {
    decoded = await jwt.verify(token, JWT_SECRET_KEY);
  } catch (err) {
    decoded = null;
  }

  return decoded;
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ ctx }) => {
    const authorization = ctx.req.headers.authorization || '';
    let token = null;
    if (authorization) {
      token = authorization.split('Bearer ');
      token = token[1];
    }
    // try to retrieve a user with the token
    const user = await getUser(token);

    return {
      ctx,
      user,
    };
  },
  // context: ({ ctx }) => {
  //   console.log(ctx.req.headers);
  //   // get the user token from the headers
  //   const authorization = ctx.req.headers.authorization || '';

  //   let token = null;
  //   if (authorization) {
  //     token = authorization.split('Bearer ');
  //   }

  //   // console.log('auth!', req.headers.authorization);

  //   // try to retrieve a user with the token
  //   const user = getUser(token);

  //   // add the user to the context
  //   // return { user, token };
  //   // return { user: null, token: null };
  //   return ctx;
  // },
  // context: ({ req }) => {
  //   // get the user token from the headers
  //   // const token = req.headers.authorization || '';

  //   console.log('auth!', req.headers.authorization);

  //   // try to retrieve a user with the token
  //   // const user = getUser(token);

  //   // add the user to the context
  //   // return { user, token };
  //   return { user: null, token: null };
  // },
});

const app = new Koa();

// const origin = process.env.CLIENT_URL || 'http://localhost:3000';

const whitelist = ['http://spot-movie.com', 'http://www.spot-movie.com'];

function checkOriginAgainstWhitelist(ctx) {
  const requestOrigin = ctx.accept.headers.origin;
  if (!whitelist.includes(requestOrigin)) {
    return ctx.throw(`🙈 ${requestOrigin} is not a valid origin`);
  }
  return requestOrigin;
}

const corsOptions = {
  credentials: true,
  origin: process.env.CLIENT_URL
    ? checkOriginAgainstWhitelist
    : 'http://localhost:3000',
};
// const corsOptions = { credentials: true, origin: origin };
server.applyMiddleware({ app, cors: corsOptions });

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
app.listen({ port }, () => {
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
});
