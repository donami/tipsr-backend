import { ApolloServer } from 'apollo-server';
import jwt from 'jsonwebtoken';

import { resolvers } from './data/resolvers';
import { typeDefs } from './data/schema';
import { JWT_SECRET } from './config/secrets';

const users = {
  1: {
    id: 1,
    email: 'james@bond.com',
    password: '123',
    firstName: 'James',
    lastName: 'Bond',
  },
};

const getUser = token => {
  try {
    if (token) {
      const tokenData = jwt.verify(token, JWT_SECRET);

      if (tokenData && tokenData.id) {
        const user = users[tokenData.id];

        if (user) {
          return user;
        }
      }
    }
    return null;
  } catch (err) {
    return null;
  }
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // get the user token from the headers
    const token = req.headers.authorization || '';

    // try to retrieve a user with the token
    const user = getUser(token);

    // add the user to the context
    return { user, token };
  },
});

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
