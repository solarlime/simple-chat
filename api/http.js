const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const { MongoClient } = require('mongodb');

const app = new Koa();
const prefix = '/api/http';
const router = new Router({ prefix });
const url = process.env.MONGO_URL;
const dbName = 'simple-chat';

function routesF() {
  const basis = {
    mongo: '/mongo',
    fetch: '/fetch',
    update: '/update',
    users: '/users',
    messages: '/messages',
  };
  return {
    mongo: basis.mongo,
    fetch: basis.mongo + basis.fetch,
    update: basis.mongo + basis.update,
    fetchUsers: basis.mongo + basis.fetch + basis.users,
    fetchMessages: basis.mongo + basis.fetch + basis.messages,
    updateUsers: basis.mongo + basis.update + basis.users,
    updateMessages: basis.mongo + basis.update + basis.messages,
  };
}
const routes = routesF(prefix);

app.use(koaCors({ allowMethods: 'GET,PUT,POST,DELETE' }));
app.use(koaBody({
  urlencoded: true,
  multipart: true,
  parsedMethods: ['POST', 'GET'],
  json: true,
}));

app.use(async (ctx, next) => {
  // eslint-disable-next-line consistent-return
  async function run() {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
      await client.connect();
      console.log('Connected correctly to server');
      const db = client.db(dbName);

      // Use the collection "items"
      const col = db.collection('names');
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

router.post(routes.updateUsers, async (ctx) => {
  const { col } = ctx.state;
  try {
    const document = ctx.request.body;
    await col.insertOne(document);
    return { status: 'Added', data: '' };
  } catch (e) {
    return { status: 'Not added', data: e };
  }
});

router.get(routes.fetchUsers, async (ctx) => {
  const { col } = ctx.state;
  const data = await col.find().toArray();
  return {
    status: 'Fetched',
    data: data.map((item) => {
      const { name } = item;
      return name;
    }),
  };
});

app.use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
