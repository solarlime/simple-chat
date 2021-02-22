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

app.use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
