import { Author, Movie, User, List, Genre, UserMovies } from './connectors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { Op, literal } from 'sequelize';
import Buffer from 'Buffer';

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

const authenticated = next => (root, args, context, info) => {
  if (!context.user) {
    throw new Error(`Unauthenticated!`);
  }

  return next(root, args, context, info);
};

export const resolvers = {
  User: {
    movies(user) {
      return user.getMovies();
    },
    lists(user) {
      return user.getLists();
    },
  },
  Movie: {
    genres(movie) {
      if (typeof movie.getGenres === 'function') {
        return movie.getGenres();
      }
      if (typeof movie.genres !== 'undefined' && movie.genres.length) {
        return movie.genres;
      }
      return [];
    },
  },
  List: {
    movies(list) {
      return list.getMovies();
    },
  },
  Query: {
    allMoviesCursor: async (_, { after, first }) => {
      let movies = [];

      if (after !== undefined) {
        const id = Buffer.from(after, 'base64').toString();
        movies = await Movie.findAll({
          limit: first,
          where: {
            id: {
              [Op.gt]: +id,
            },
          },
        });
      } else {
        movies = await Movie.findAll({
          limit: first,
        });
      }

      let endCursor;
      const edges = movies.map(movie => {
        endCursor = Buffer.from(movie.id.toString()).toString('base64');
        return {
          cursor: endCursor,
          node: movie,
        };
      });

      let hasNextPage = false;

      if (!!movies.length) {
        const id = Buffer.from(endCursor, 'base64').toString();
        console.log('id', id);
        hasNextPage = await Movie.findOne({
          where: {
            id: {
              [Op.gt]: +id,
            },
          },
        }).then(movie => {
          return !!movie;
        });
      }

      return {
        edges,
        pageInfo: {
          hasNextPage: hasNextPage,
          endCursor,
        },
        //  totalCount,
      };
    },
    author(_, args) {
      return Author.find({ where: args });
    },
    authors() {
      return Author.findAll();
    },
    movies(root, { featured }) {
      const query = { where: {} };

      if (typeof featured === 'boolean') {
        query.where = { featured };
      }

      return Movie.findAll(query);
    },
    movie(root, { id }) {
      return Movie.findByPk(id);
    },
    genres() {
      return Genre.findAll();
    },
    genre(root, { id }) {
      return Genre.findByPk(id);
    },
    async upcoming() {
      const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`;
      const results = await fetch(url);

      const json = await results.json();

      if (json.results <= 0) {
        return [];
      }

      const movies = await Promise.all(
        json.results.map(movie => {
          return Movie.findOne({
            where: { externalId: movie.id },
          }).then(found => {
            return {
              id: found ? found.id : movie.id,
              title: movie.title,
              externalId: movie.id,
              description: movie.overview,
              poster: createDefaultPosterPath(movie.poster_path),
              backdropPath: movie.backdrop_path
                ? createDefaultPosterPath(
                    movie.backdrop_path,
                    API_POSTER_SIZES.huge
                  )
                : null,
            };
          });
        })
      );
      return { movies };
    },
    async videos(root, { externalMovieId }) {
      const url = `https://api.themoviedb.org/3/movie/${externalMovieId}/videos?api_key=${API_KEY}&language=en-US`;
      const results = await fetch(url);

      const json = await results.json();

      if (json.results <= 0) {
        return [];
      }

      return {
        videos: json.results,
      };
    },
    async nowPlaying(root, args) {
      const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;
      const results = await fetch(url);

      const json = await results.json();

      if (json.results <= 0) {
        return [];
      }

      const movies = await Promise.all(
        json.results.map(movie => {
          return Movie.findOne({
            where: { externalId: movie.id },
          }).then(found => {
            return {
              id: found ? found.id : movie.id,
              title: movie.title,
              externalId: movie.id,
              description: movie.overview,
              poster: createDefaultPosterPath(movie.poster_path),
              backdropPath: movie.backdrop_path
                ? createDefaultPosterPath(
                    movie.backdrop_path,
                    API_POSTER_SIZES.huge
                  )
                : null,
            };
          });
        })
      );
      return { movies };
    },
    users() {
      return User.findAll();
    },
    async reviews(root, { movieId }) {
      const url = `https://api.themoviedb.org/3/movie/${movieId}/reviews?api_key=${API_KEY}&language=en-US&page=1`;
      const results = await fetch(url);

      const json = await results.json();

      if (json.results <= 0) {
        return [];
      }

      return {
        reviews: json.results,
      };
    },
    async search(root, { term, limit }) {
      if (!term || !term.length) {
        return null;
      }

      return Movie.findAll({
        where: {
          title: {
            [Op.iLike]: `%${term}%`,
          },
        },
        limit: limit || 999,
      });
    },
    async similar(root, { externalId }) {
      const url = `https://api.themoviedb.org/3/movie/${externalId}/similar?api_key=${API_KEY}&language=en-US&page=1`;
      const results = await fetch(url);

      const json = await results.json();

      if (json.total_results <= 0) {
        return [];
      }

      const genresUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`;
      const allGenres = await fetch(genresUrl)
        .then(res => res.json())
        .then(json => {
          return json;
        });

      return Promise.all(
        json.results.map(movie => {
          return Movie.findOne({
            where: { externalId: movie.id },
          }).then(async found => {
            let genres = [];

            if (found) {
              genres = found.genres;
            } else {
              genres = movie.genre_ids
                .map(genreId => {
                  return (allGenres.genres || []).find(g => g.id === genreId);
                })
                .filter(g => !!g);
            }

            return {
              id: found ? found.id : movie.id,
              title: movie.title,
              externalId: movie.id,
              genres: genres,
              description: movie.overview,
              poster: createDefaultPosterPath(movie.poster_path),
            };
          });
        })
      );
    },
    me: authenticated((root, args, context) => context.user),
    favorites: async (root, args, context) => {
      if (!context.user) {
        return [];
      }
      const user = await User.findByPk(context.user.id);

      return user.getMovies();
    },
    lists: authenticated(async (root, args, context) => {
      const user = await User.findByPk(context.user.id);

      return user.getLists();
    }),
    list: authenticated(async (root, { listId }, context) => {
      return List.findByPk(listId);
    }),
    suggest: async (root, { filters }) => {
      const genreWhere = {};

      if (filters.genre && !!filters.genre.length) {
        genreWhere.id = {
          [Op.in]: filters.genre,
        };
      }
      const query = {
        order: literal('random()'),
        where: {},
        include: [
          {
            model: Genre,
            as: 'genres',
            where: genreWhere,
          },
        ],
      };

      if (filters) {
        if (filters.minRating) {
          query.where = Object.assign({}, query.where, {
            voteAverage: {
              [Op.gte]: filters.minRating,
            },
          });
        }
        if (filters.startYear && !!filters.startYear.length) {
          const startYear = new Date();
          startYear.setYear(+filters.startYear);
          startYear.setMonth(0);
          startYear.setDate(1);
          query.where = Object.assign({}, query.where, {
            releaseDate: {
              [Op.gte]: startYear,
            },
          });
        }
        if (filters.endYear && !!filters.endYear.length) {
          const endYear = new Date();
          endYear.setYear(+filters.endYear);
          endYear.setMonth(0);
          endYear.setDate(1);
          query.where = Object.assign({}, query.where, {
            releaseDate: {
              [Op.lte]: endYear,
            },
          });
        }
      }

      const movie = await Movie.findOne(query);

      return { movie };
    },

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
    signup: async (root, args) => {
      let error = null;
      let user = null;

      try {
        user = await User.create({
          email: args.email,
          password: args.password,
          firstName: args.firstName,
          lastName: args.lastName,
        });
      } catch (e) {
        if (e.errors && !!e.errors.length) {
          if (
            e.errors[0].type === 'unique violation' &&
            e.errors[0].path === 'email'
          ) {
            error = {
              message: 'A user with that email already exists.',
            };
          } else {
            error = {
              message: 'Oops.. something went wrong.',
            };
          }
        }
      }
      return {
        user,
        error,
      };
    },
    login: async (root, { email, password }) => {
      const user = await User.findOne({
        where: {
          email: email,
          password: password,
        },
      });

      if (!user) {
        return {
          error: {
            message: 'Invalid email / password combination.',
          },
        };
      }

      user.token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        JWT_SECRET
      );

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
            description: movie.overview,
          };
        });
      } catch (error) {
        console.log(error);
      }

      return [];
    },
    addGenre: async (root, { name }) => {
      const genre = await Genre.create({
        name,
      });

      return genre;
    },
    updateGenre: async (root, { id, name }) => {
      const genre = await Genre.findByPk(id);

      genre.name = name || genre.name;

      return genre.save();
    },
    removeGenre: async (root, { id }) => {
      const genre = await Genre.findByPk(id);

      await genre.destroy();
      return genre;
    },
    updateMovie: async (root, args) => {
      const movie = await Movie.findByPk(args.movieId);

      if (movie) {
        movie.featured =
          typeof args.featured === 'boolean' ? args.featured : movie.featured;
      }

      const res = await movie.save();

      return {
        movie: res,
      };
    },
    addExternalMovie: async (root, { externalId }) => {
      try {
        const url = `https://api.themoviedb.org/3/movie/${externalId}?api_key=${API_KEY}&language=en-US`;
        const results = await fetch(url);

        const json = await results.json();

        if (json && json.id) {
          const movie = await Movie.create({
            title: json.title,
            genres: json.genres,
            releaseDate: json.release_date,
            poster: createDefaultPosterPath(json.poster_path),
            backdropPath: json.backdrop_path
              ? createDefaultPosterPath(
                  json.backdrop_path,
                  API_POSTER_SIZES.huge
                )
              : null,
            voteAverage: json.vote_average,
            externalId: json.id,
            description: json.overview,
          });

          if (json.genres && !!json.genres.length) {
            const genres = await Promise.all(
              json.genres.map(genre => {
                return Genre.findOrCreate({
                  where: {
                    id: genre.id,
                    name: genre.name,
                  },
                }).then(([genre, created]) => {
                  return genre;
                });
              })
            );

            await movie.setGenres(genres);
          }

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
          description: args.description,
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
              error: {
                message: 'A movie with this title already exists.',
              },
            };
          }
        }
        return { error: { message: error.message } };
      }
    },
    addFavorite: authenticated(async (root, args, { user }) => {
      const userData = await User.findByPk(user.id, {
        include: [
          {
            model: Movie,
            as: 'movies',
          },
        ],
      });
      const movie = await Movie.findByPk(args.movieId);

      if (!movie) {
        throw new Error('Unable to find movie.');
      }

      const alreadyExists = !!userData.movies.find(
        item => item.id === movie.id
      );

      if (alreadyExists) {
        await userData.removeMovie(movie);
      } else {
        await userData.addMovie(movie);
      }

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
