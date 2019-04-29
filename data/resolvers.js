import { Author, Movie } from './connectors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

import { JWT_SECRET, API_KEY } from '../config/secrets';

const API_BASE_URL = 'http://image.tmdb.org/t/p/';
const API_POSTER_SIZES = {
  tiny: 'w92',
  small: 'w154',
  medium: 'w185',
  large: 'w342',
  extraLarge: 'w500',
  huge: 'w780',
  original: 'original',
};

// This is a (sample) collection of books we'll be able to query
// the GraphQL server for.  A more complete example might fetch
// from an existing data source like a REST API or database.
const books = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
  },
];

const users = [
  { id: 1, email: 'admin@email.com', password: '123' },
  { id: 2, email: 'user@email.com', password: '123' },
];

const authenticated = next => (root, args, context, info) => {
  if (!context.user) {
    // console.log('WHAT');
    throw new Error(`Unauthenticated!`);
  }

  return next(root, args, context, info);
};

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
export const resolvers = {
  Query: {
    books: () => books,
    author(_, args) {
      return Author.find({ where: args });
    },
    authors() {
      return Author.findAll();
    },
    movies() {
      return Movie.findAll();
    },
    me: authenticated((root, args, context) => context.user),
    serverTime: () => new Date(),
  },
  Mutation: {
    addAuthor: async (root, args) => {
      const author = await Author.create({
        firstName: args.firstName,
        lastName: args.lastName,
      });

      return author;
    },
    login: async (root, { email, password }) => {
      const user = users.find(
        user => user.email === email && user.password === password
      );

      if (!user) {
        return {
          error: {
            message: 'Invalid email / password combination.',
          },
        };
      }

      user.jwt = jwt.sign({ id: user.id }, JWT_SECRET);

      return { user };
    },
    findMovies: async (root, { title }) => {
      try {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&page=1&include_adult=false&query=${title}`;
        const results = await fetch(url);

        const json = await results.json();

        if (json.total_results <= 0) {
          return [];
        }

        return json.results.map(movie => {
          return {
            id: movie.id,
            title: movie.title,
            poster: `${API_BASE_URL}${API_POSTER_SIZES.large}${
              movie.poster_path
            }`,
          };
        });
      } catch (error) {
        console.log(error);
      }

      return [];
    },
    addMovie: async (root, args) => {
      try {
        const movie = await Movie.create({
          title: args.title,
          poster: args.poster,
        });
        return { movie };
      } catch (error) {
        if (error.errors && error.errors[0]) {
          const duplicateError = error.errors[0];

          if (
            duplicateError.type === 'unique violation' &&
            duplicateError.path === 'title'
          ) {
            return {
              error: { message: 'A movie with this title already exists.' },
            };
          }
        }
        return { error: { message: error.message } };
      }
    },
  },
};
