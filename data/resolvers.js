import { Author, Movie, User, List } from './connectors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { Op } from 'sequelize';

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

const debugModel = model => {
  for (let assoc of Object.keys(model.associations)) {
    for (let accessor of Object.keys(model.associations[assoc].accessors)) {
      console.log(
        model.name + '.' + model.associations[assoc].accessors[accessor] + '()'
      );
    }
  }
};

const createDefaultPosterPath = (poster, size = API_POSTER_SIZES.large) => {
  return `${API_BASE_URL}${size}${poster}`;
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
    throw new Error(`Unauthenticated!`);
  }

  return next(root, args, context, info);
};

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
export const resolvers = {
  User: {
    movies(user) {
      return user.getMovies();
    },
    lists(user) {
      return user.getLists();
    },
  },
  List: {
    movies(list) {
      return list.getMovies();
    },
  },
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
    movie(root, { id }) {
      return Movie.findByPk(id);
    },
    users() {
      return User.findAll();
    },
    async search(root, { term }) {
      if (!term || !term.length) {
        return null;
      }

      return Movie.findAll({
        where: {
          title: {
            [Op.iLike]: `%${term}%`,
          },
        },
      });
    },
    async similar(root, { externalId }) {
      const url = `https://api.themoviedb.org/3/movie/${externalId}/similar?api_key=${API_KEY}&language=en-US&page=1`;
      const results = await fetch(url);

      const json = await results.json();

      if (json.total_results <= 0) {
        return [];
      }

      return Promise.all(
        json.results.map(movie => {
          return Movie.findOne({ where: { externalId: movie.id } }).then(
            found => {
              return {
                id: found ? found.id : movie.id,
                title: movie.title,
                externalId: movie.id,
                poster: createDefaultPosterPath(movie.poster_path),
              };
            }
          );
        })
      );

      // return json.results.map(movie => {
      //   return {
      //     id: movie.id,
      //     title: movie.title,
      //     externalId: movie.id,
      //     poster: createDefaultPosterPath(movie.poster_path),
      //   };
      // });
    },
    me: authenticated((root, args, context) => context.user),
    favorites: authenticated(async (root, args, context) => {
      const user = await User.findByPk(context.user.id);

      return user.getMovies();
    }),
    lists: authenticated(async (root, args, context) => {
      const user = await User.findByPk(context.user.id);

      return user.getLists();
    }),
    list: authenticated(async (root, { listId }, context) => {
      return List.findByPk(listId);
    }),
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
            poster: createDefaultPosterPath(movie.poster_path),
            voteAverage: movie.vote_average,
          };
        });
      } catch (error) {
        console.log(error);
      }

      return [];
    },
    addExternalMovie: async (root, { externalId }) => {
      try {
        const url = `https://api.themoviedb.org/3/movie/${externalId}?api_key=${API_KEY}&language=en-US`;
        const results = await fetch(url);

        const json = await results.json();

        if (json && json.id) {
          const movie = await Movie.create({
            title: json.title,
            poster: createDefaultPosterPath(json.poster_path),
            voteAverage: json.vote_average,
            externalId: json.id,
          });

          return { movie };
        }
        return {
          error: {
            message: 'Movie not found.',
          },
        };
      } catch (error) {
        return {
          error: {
            message: error.message,
          },
        };
      }
    },
    addMovie: async (root, args) => {
      try {
        const movie = await Movie.create({
          title: args.title,
          poster: args.poster,
          voteAverage: args.voteAverage,
          externalId: args.externalId,
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
    addFavorite: authenticated(async (root, args, { user }) => {
      const userData = await User.findByPk(user.id);
      const movie = await Movie.findByPk(args.movieId);

      if (!movie) {
        throw new Error('Unable to find movie.');
      }

      await userData.addMovie(movie);
      const favorites = await userData.getMovies();

      return {
        favorites,
      };
    }),
    addToList: authenticated(async (root, { listId, movieId }) => {
      const list = await List.findByPk(listId);
      const movie = await Movie.findByPk(movieId);

      if (!movie) {
        throw new Error('Unable to find movie.');
      }

      if (!list) {
        throw new Error('Unable to find list.');
      }

      await list.addMovie(movie);

      return {
        list,
      };
    }),
    removeFromList: authenticated(async (root, { listId, movieId }) => {
      const list = await List.findByPk(listId);
      const movie = await Movie.findByPk(movieId);

      if (!movie) {
        throw new Error('Unable to find movie.');
      }

      if (!list) {
        throw new Error('Unable to find list.');
      }

      await list.removeMovie(movie);

      return {
        list,
      };
    }),
    addList: authenticated(async (root, args, context) => {
      const list = await List.create({
        title: args.title,
      });

      const user = await User.findByPk(context.user.id);

      await user.addList(list);

      return { list };
    }),
    removeList: authenticated(async (root, args) => {
      const list = await List.findByPk(args.listId);

      await list.destroy();
      return { list };
    }),
  },
};
