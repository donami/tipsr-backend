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

  type List {
    id: Int!
    title: String!
    movies: [Movie]
  }

  type User {
    id: Int
    firstName: String
    lastName: String
    email: String
    password: String
    jwt: String
    movies: [Movie]
    lists: [List]
  }

  type Movie {
    id: Int!
    title: String!
    poster: String
    externalId: Int
    voteAverage: Float
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

  type AddFavoritePayload {
    favorites: [Movie]
    error: Error
  }

  type AddListPayload {
    list: List
    error: Error
  }

  type RemoveListPayload {
    list: List
    error: Error
  }

  type AddToListPayload {
    list: List
    error: Error
  }

  type RemoveFromListPayload {
    list: List
    error: Error
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    books: [Book]
    authors: [Author]
    movies: [Movie]
    movie(id: Int!): Movie
    search(term: String): [Movie]
    similar(externalId: Int!): [Movie]
    author(id: Int): Author
    users: [User]
    me: User
    serverTime: String
    favorites: [Movie]
    lists: [List]
    list(listId: Int!): List
  }

  type Mutation {
    addAuthor(firstName: String!, lastName: String!): Author
    addExternalMovie(externalId: Int!): AddMoviePayload
    login(email: String!, password: String!): LoginPayload
    findMovies(title: String): [Movie]
    addMovie(
      title: String!
      poster: String
      externalId: Int
      voteAverage: Float
    ): AddMoviePayload
    addFavorite(movieId: Int!): AddFavoritePayload
    addList(title: String!): AddListPayload
    removeList(listId: Int!): RemoveListPayload
    addToList(listId: Int!, movieId: Int!): AddToListPayload
    removeFromList(listId: Int!, movieId: Int!): RemoveFromListPayload
  }
`;
