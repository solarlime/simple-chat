const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const { MongoClient } = require('mongodb');

/**
 * Make a serverless function with Koa
 * @type {module.Application}
 */

const app = new Koa();
const prefix = '/api/http';
const router = new Router({ prefix });
const url = process.env.MONGO_URL;
const dbName = 'simple-chat';

/**
 * Define the routes for our convenience
 * @returns {{mongo: string, fetchUsers: string, fetch: string,
 *            updateMessages: string, update: string,
 *            fetchMessages: string, deleteUsers: string, updateUsers: string}}
 */
function routesF() {
  const basis = {
    mongo: '/mongo',
    fetch: '/fetch',
    update: '/update',
    delete: '/delete',
    users: '/users',
    messages: '/messages',
  };
  return {
    mongo: basis.mongo,
    fetch: basis.mongo + basis.fetch,
    update: basis.mongo + basis.update,
    fetchUsers: basis.mongo + basis.fetch + basis.users,
    updateUsers: basis.mongo + basis.update + basis.users,
    deleteUsers: basis.mongo + basis.delete + basis.users,
  };
}
const routes = routesF(prefix);

app.use(koaCors({ allowMethods: 'GET,POST' }));
app.use(koaBody({
  urlencoded: true,
  multipart: true,
  parsedMethods: ['POST', 'GET'],
  json: true,
}));

/**
 * The main middleware. It's called it on each request, gives an access to our DB.
 * Then calls next() due to the route
 */
app.use(async (ctx, next) => {
  // eslint-disable-next-line consistent-return
  async function run() {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
      await client.connect();
      console.log('Connected correctly to server');
      const db = client.db(dbName);

      const col = db.collection('names');
      // Save col in ctx.state for sending it to middlewares
      ctx.state.col = col;
      const res = await next();
      return res;
    } catch (err) {
      console.log(err.stack);
    } finally {
      await client.close();
      console.log('Closed!');
    }
  }

  // eslint-disable-next-line no-return-assign
  const result = await run().catch(console.dir);
  console.log(result);
  ctx.response.body = JSON.stringify(result);
});

/**
 * Service function. Returns an array of users
 * @param col
 * @returns {Promise<*>}
 */
async function getUsers(col) {
  const data = await col.find().toArray();
  return data.map((item) => {
    const { name } = item;
    return name;
  });
}

/**
 * Middleware to add a new user (if doesn't exist)
 */
router.post(routes.updateUsers, async (ctx) => {
  const { col } = ctx.state;
  try {
    const document = ctx.request.body;
    const findUser = await col.findOne({ name: document.name });
    if (findUser) {
      throw new Error('This user has already connected!');
    }
    await col.insertOne(document);
    return { status: 'Added', data: await getUsers(col) };
  } catch (e) {
    return { status: 'Not added', data: e.message };
  }
});

/**
 * Middleware to delete a user. It's also possible to drop the whole DB.
 * Use it only to fix the errors!
 */
router.post(routes.deleteUsers, async (ctx) => {
  const { col } = ctx.state;
  try {
    const document = ctx.request.body;
    if (!document.name) {
      if (await col.findOne({})) {
        await col.drop();
        return { status: 'Removed all', data: '' };
      }
      return { status: 'Already all removed', data: '' };
    }
    await col.deleteMany({ name: document.name });
    return { status: 'Removed', data: '' };
  } catch (e) {
    return { status: 'Not removed', data: e.message };
  }
});

/**
 * Middleware to return users. A wrapper for getUsers
 */
router.get(routes.fetchUsers, async (ctx) => {
  const { col } = ctx.state;
  return {
    status: 'Fetched',
    data: await getUsers(col),
  };
});

app.use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
