import { gql } from 'apollo-server';

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
export const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.

  type MoviesResult {
    movies: [Movie]
    totalCount: Int
  }
  type Edge {
    cursor: String!
    node: Movie!
  }
  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
  }
  type MoviesResultCursor {
    edges: [Edge]!
    pageInfo: PageInfo!
    totalCount: Int!
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
    fullName: String
    email: String
    password: String
    role: String
    token: String
    movies: [Movie]
    lists: [List]
    topics: [ForumTopic]
    posts: [ForumPost]
  }

  type Credential {
    token: String!
    email: String!
    name: String!
    role: String
  }

  type Video {
    id: String!
    key: String!
    name: String!
    site: String!
    type: String!
    size: Int
  }

  type Movie {
    id: Int!
    title: String!
    description: String
    poster: String
    backdropPath: String
    externalId: Int
    releaseDate: String
    voteAverage: Float
    genres: [Genre]
    featured: Boolean
    forumCategory: ForumCategory
  }

  type Genre {
    id: Int!
    name: String!
  }

  type ForumCategory {
    id: Int!
    title: String!
    description: String
    views: Int!
    posts: Int!
    topics: [ForumTopic]
    movie: Movie
    createdAt: String
    updatedAt: String
  }

  type ForumTopic {
    id: Int!
    title: String!
    views: Int!
    category: ForumCategory
    message: String!
    user: User
    posts: [ForumPost]
    createdAt: String
  }

  type ForumPost {
    id: Int!
    message: String!
    user: User
    createdAt: String
  }

  type Review {
    id: String! # external api uses string
    author: String!
    content: String!
    url: String
  }

  type Error {
    message: String!
  }

  type LoginPayload {
    user: User
    error: Error
  }

  type SignupPayload {
    user: User
    error: Error
  }

  type VideosPayload {
    videos: [Video]
    error: Error
  }

  type NowPlayingPayload {
    movies: [Movie]
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

  type ReviewsResponse {
    reviews: [Review]
    error: Error
  }

  type SuggestPayload {
    movie: Movie
    error: Error
  }

  type UpcomingPayload {
    movies: [Movie]
    error: Error
  }

  input SuggestFiltersInput {
    startYear: String
    endYear: String
    genre: [Int] # Array of genre ids
    minRating: Int
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    allMoviesCursor(after: String, first: Int): MoviesResultCursor
    authors: [Author]
    movies(featured: Boolean): [Movie]
    movie(id: Int!): Movie
    reviews(movieId: Int!): ReviewsResponse
    genre(id: Int!): Genre
    genres: [Genre]
    search(term: String, limit: Int): [Movie]
    similar(externalId: Int!): [Movie]
    author(id: Int): Author
    users: [User]
    me: User
    forumCategories: [ForumCategory]
    forumCategory(id: Int!): ForumCategory
    forumTopic(id: Int!): ForumTopic
    forumTopics: [ForumTopic]
    serverTime: String
    favorites: [Movie]
    upcoming: UpcomingPayload
    nowPlaying: NowPlayingPayload
    lists: [List]
    list(listId: Int!): List
    videos(externalMovieId: Int!): VideosPayload
    suggest(filters: SuggestFiltersInput): SuggestPayload
  }

  type Mutation {
    addForumCategory(title: String!, description: String): ForumCategory
    addForumTopic(
      title: String!
      message: String!
      categoryId: Int!
    ): ForumTopic
    addForumPost(message: String!, topicId: Int!): ForumPost
    addAuthor(firstName: String!, lastName: String!): Author
    addGenre(name: String!): Genre
    updateGenre(id: Int!, name: String!): Genre
    removeGenre(id: Int!): Genre
    addExternalMovie(externalId: Int!): AddMoviePayload
    login(email: String!, password: String!): LoginPayload
    signup(
      email: String!
      password: String!
      firstName: String!
      lastName: String!
    ): SignupPayload
    findMovies(title: String): [Movie]
    addMovie(
      title: String!
      poster: String
      externalId: Int
      voteAverage: Float
      description: String
    ): AddMoviePayload
    addFavorite(movieId: Int!): AddFavoritePayload
    addList(title: String!): AddListPayload
    updateMovie(movieId: Int!, featured: Boolean): AddMoviePayload
    removeList(listId: Int!): RemoveListPayload
    addToList(listId: Int!, movieId: Int!): AddToListPayload
    removeFromList(listId: Int!, movieId: Int!): RemoveFromListPayload
  }
`;
