import { gql } from 'apollo-server';

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
export const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.

  # This "Book" type can be used in other type declarations.
  type Book {
    title: String
    author: String
  }

  type Author {
    firstName: String
    lastName: String
  }

  type User {
    id: Int
    firstName: String
    lastName: String
    email: String
    password: String
    jwt: String
  }

  type Movie {
    id: Int!
    title: String!
    poster: String
  }

  type Error {
    message: String!
  }

  type LoginPayload {
    user: User
    error: Error
  }

  type AddMoviePayload {
    movie: Movie
    error: Error
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    books: [Book]
    authors: [Author]
    movies: [Movie]
    author(id: Int): Author
    me: User
    serverTime: String
  }

  type Mutation {
    addAuthor(firstName: String!, lastName: String!): Author
    login(email: String!, password: String!): LoginPayload
    findMovies(title: String): [Movie]
    addMovie(title: String!, poster: String): AddMoviePayload
  }
`;
