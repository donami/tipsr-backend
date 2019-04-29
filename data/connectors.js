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

const MovieModel = db.define('movie', {
  title: { type: Sequelize.STRING, unique: true },
  poster: { type: Sequelize.STRING },
});

AuthorModel.hasMany(PostModel, { as: 'posts' });
PostModel.belongsTo(AuthorModel);

const Author = db.models.author;
const Post = db.models.post;
const Movie = db.models.movie;

// modify the mock data creation to also create some views:
// casual.seed(123);
db.sync({ force: true }).then(async () => {
  await PostModel.create({
    title: 'A Post',
    text: 'A Text',
  });

  return Promise.resolve();
});

export { Author, Post, Movie };
