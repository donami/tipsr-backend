import Sequelize from 'sequelize';

const production = process.env.DATABASE_URL ? true : false;

var db = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:hejsan@localhost/tipsr',
  {
    dialect: 'postgres',
    dialectOptions: {
      ssl: production ? true : false,
    },
  }
);

const AuthorModel = db.define('author', {
  firstName: { type: Sequelize.STRING },
  lastName: { type: Sequelize.STRING },
});

const PostModel = db.define('post', {
  title: { type: Sequelize.STRING },
  text: { type: Sequelize.STRING },
});

const UserModel = db.define('user', {
  email: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
  firstName: { type: Sequelize.STRING },
  lastName: { type: Sequelize.STRING },
});

const MovieModel = db.define('movie', {
  title: { type: Sequelize.STRING, unique: true },
  poster: { type: Sequelize.STRING },
  externalId: { type: Sequelize.INTEGER },
  voteAverage: { type: Sequelize.FLOAT },
});

const ListModel = db.define('list', {
  title: { type: Sequelize.STRING },
});

const ListMoviesModel = db.define('listMovies', {});
const UserMoviesModel = db.define('userMovies', {});

AuthorModel.hasMany(PostModel, { as: 'posts' });
PostModel.belongsTo(AuthorModel);

UserModel.belongsToMany(MovieModel, { through: UserMoviesModel });
MovieModel.belongsToMany(UserModel, { through: UserMoviesModel });

UserModel.hasMany(ListModel, { as: 'lists' });
ListModel.belongsTo(UserModel);

ListModel.belongsToMany(MovieModel, { through: ListMoviesModel });
MovieModel.belongsToMany(ListModel, { through: ListMoviesModel });

const Author = db.models.author;
const Post = db.models.post;
const Movie = db.models.movie;
const User = db.models.user;
const List = db.models.list;

// modify the mock data creation to also create some views:
// casual.seed(123);
db.sync({ force: true }).then(async () => {
  const firstUser = await UserModel.create({
    email: 'admin@email.com',
    password: '123',
    firstName: 'James',
    lastName: 'Bond',
  });
  await UserModel.create({
    email: 'user@email.com',
    password: '123',
    firstName: 'Jane',
    lastName: 'Doe',
  });

  const testMovie = await MovieModel.create({
    title: 'The Lord of the Rings: The Return of the King',
    poster: 'http://image.tmdb.org/t/p/w342/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
    externalId: 122,
    voteAverage: 8.0,
  });

  await firstUser.setMovies([testMovie]);

  const firstList = await ListModel.create({
    title: 'My Favorite Movies',
  });
  const secondList = await ListModel.create({
    title: 'My Next Best Movies',
  });

  await firstUser.setLists([firstList, secondList]);

  await firstList.setMovies([testMovie]);

  await PostModel.create({
    title: 'A Post',
    text: 'A Text',
  });

  return Promise.resolve();
});

export { Author, Post, Movie, User, List };
