/* eslint-disable no-await-in-loop */

const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const fetch = require('node-fetch');

const app = new Koa();
const router = new Router({ prefix: '/api/fanout' });
const CHANNEL_NAME = 'simple-chat';

app.use(koaCors({ allowMethods: 'GET,PUT,POST,DELETE' }));
app.use(koaBody({
  urlencoded: true,
  multipart: true,
  parsedMethods: ['POST', 'GET'],
  json: true,
}));

router.get('/', async (ctx) => {
  try {
    const response = await fetch('https://api.fanout.io/realm/8bcbc7a2/subscriptions/items/', {
      headers: {
        Authorization: `Bearer ${process.env.FANOUT_TOKEN}`,
      },
    });
    const resultArray = await response.json();
    if (!resultArray.items.length) {
      ctx.response.body = { state: 'unsubscribed' };
    } else {
      const result = resultArray.items.find((item) => item.channel === CHANNEL_NAME);
      if (result && result.state) {
        ctx.response.body = { state: result.state };
      } else {
        throw new Error('this channel isn\'t found!');
      }
    }
  } catch (e) {
    ctx.response.body = { error: e.message };
  }
});

app.use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
