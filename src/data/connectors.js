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
  email: { type: Sequelize.STRING, unique: true },
  password: { type: Sequelize.STRING },
  firstName: { type: Sequelize.STRING },
  lastName: { type: Sequelize.STRING },
  role: { type: Sequelize.STRING, defaultValue: 'USER' },
});

const MovieModel = db.define('movie', {
  title: { type: Sequelize.STRING, unique: true },
  poster: { type: Sequelize.STRING },
  backdropPath: { type: Sequelize.STRING },
  description: { type: Sequelize.TEXT },
  externalId: { type: Sequelize.INTEGER },
  voteAverage: { type: Sequelize.FLOAT },
  releaseDate: { type: Sequelize.DATEONLY },
  featured: { type: Sequelize.BOOLEAN, defaultValue: false },
});

MovieModel.addHook('afterCreate', async (movie, options) => {
  const category = await ForumCategory.create({
    title: movie.title,
  });

  await movie.setForumCategory(category);
});

const ListModel = db.define('list', {
  title: { type: Sequelize.STRING },
});

const ForumCategoryModel = db.define('forumCategory', {
  title: { type: Sequelize.STRING },
  views: { type: Sequelize.INTEGER, defaultValue: 0 },
  posts: { type: Sequelize.INTEGER, defaultValue: 0 },
  // topics: { type: Sequelize.STRING },
});

const ForumTopicModel = db.define(
  'forumTopic',
  {
    title: { type: Sequelize.STRING },
    message: { type: Sequelize.TEXT },
    views: { type: Sequelize.INTEGER, defaultValue: 0 },
  },
  { timestamps: true }
);

const ForumPostModel = db.define(
  'forumPost',
  {
    message: { type: Sequelize.TEXT },
    // createdAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.literal('NOW()'),
    // },
  },
  {
    timestamps: true,
  }
);

const GenreModel = db.define('genre', {
  name: { type: Sequelize.STRING },
});

const ListMoviesModel = db.define('listMovies', {});
const UserMoviesModel = db.define('userMovies', {});
const MovieGenresModel = db.define('movieGenres', {});

AuthorModel.hasMany(PostModel, { as: 'posts' });
PostModel.belongsTo(AuthorModel);

ForumCategoryModel.hasMany(ForumTopicModel, { as: 'topics' });
ForumTopicModel.belongsTo(ForumCategoryModel);

ForumTopicModel.hasMany(ForumPostModel, { as: 'posts' });
ForumPostModel.belongsTo(ForumTopicModel);

MovieModel.hasOne(ForumCategoryModel);
// MovieModel.hasOne(ForumCategoryModel, { as: 'forumCategory' });
// ForumCategoryModel.belongsTo(MovieModel);

UserModel.hasMany(ForumPostModel, { as: 'posts' });
ForumPostModel.belongsTo(UserModel);

UserModel.hasMany(ForumTopicModel, { as: 'topics' });
ForumTopicModel.belongsTo(UserModel);

UserModel.belongsToMany(MovieModel, { through: UserMoviesModel });
MovieModel.belongsToMany(UserModel, { through: UserMoviesModel });

UserModel.hasMany(ListModel, { as: 'lists' });
ListModel.belongsTo(UserModel);

ListModel.belongsToMany(MovieModel, { through: ListMoviesModel });
MovieModel.belongsToMany(ListModel, { through: ListMoviesModel });

GenreModel.belongsToMany(MovieModel, { through: MovieGenresModel });
MovieModel.belongsToMany(GenreModel, { through: MovieGenresModel });

const Author = db.models.author;
const Post = db.models.post;
const Movie = db.models.movie;
const User = db.models.user;
const Genre = db.models.genre;
const List = db.models.list;
const ForumCategory = db.models.forumCategory;
const ForumTopic = db.models.forumTopic;
const ForumPost = db.models.forumPost;

// modify the mock data creation to also create some views:
// casual.seed(123);
if (!production) {
  db.sync({ force: true }).then(async () => {
    const firstUser = await UserModel.create({
      email: 'admin@email.com',
      password: '123',
      firstName: 'James',
      lastName: 'Bond',
      role: 'SYSADMIN',
    });
    const secondUser = await UserModel.create({
      email: 'user@email.com',
      password: '123',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'USER',
    });

    const _forumPost = await ForumPost.create({
      message: 'This is a lorem ipsum post.',
    });
    const _forumTopic = await ForumTopic.create({
      title: 'This is a lorem ipsum topic.',
      message: 'Hello, I have a question!',
    });
    const forumCat = await ForumCategory.create({
      title: 'First forum category',
    });

    await _forumTopic.setUser(secondUser);
    await _forumPost.setUser(firstUser);
    await _forumTopic.addPost(_forumPost);
    await forumCat.addTopic(_forumTopic);

    const GenreAdventure = await GenreModel.create({
      name: 'Adventure',
    });
    const testMovie = await MovieModel.create({
      title: 'The Lord of the Rings: The Return of the King',
      poster: 'http://image.tmdb.org/t/p/w342/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
      backdropPath:
        'http://image.tmdb.org/t/p/w1280/kiWvoV78Cc3fUwkOHKzyBgVdrDD.jpg',
      description:
        'A darkness swirls at the center of a world-renowned dance company, one that will engulf the artistic director, an ambitious young dancer, and a grieving psychotherapist. Some will succumb to the nightmare. Others will finally wake up.',
      externalId: 122,
      featured: true,
      voteAverage: 8.0,
      releaseDate: '2006-01-01',
    });

    await testMovie.setGenres([GenreAdventure]);

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
} else {
  db.sync({ force: false }).then(() => {
    console.log('DB Synced');
  });
}

export {
  Author,
  Post,
  Movie,
  User,
  List,
  Genre,
  ForumCategory,
  ForumPost,
  ForumTopic,
};
