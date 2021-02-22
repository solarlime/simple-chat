const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const { ServeGrip } = require('@fanoutio/serve-grip');
const { WebSocketMessageFormat } = require('@fanoutio/grip');

const CHANNEL_NAME = 'simple-chat';
const app = new Koa();
const router = new Router({ prefix: '/api/ws' });
const serveGrip = new ServeGrip(
  {
    grip: {
      control_uri: 'https://api.fanout.io/realm/8bcbc7a2',
      control_iss: '8bcbc7a2',
      key: Buffer.from(process.env.GRIP_KEY, 'base64'),
    },
  },
);

app.use(koaCors({ allowMethods: 'GET,PUT,POST,DELETE' }));
app.use(koaBody({
  urlencoded: true,
  multipart: true,
  parsedMethods: ['POST', 'GET'],
  json: true,
}));
app.use(serveGrip.koa);

// Websocket-over-HTTP is translated to HTTP POST
router.post('/', async (ctx) => {
  const { wsContext } = ctx.req.grip;
  if (wsContext == null) {
    ctx.response.status = 400;
    ctx.response.body = '[not a websocket request]\n';
    return;
  }

  // If this is a new connection, accept it and subscribe it to a channel
  if (wsContext.isOpening()) {
    wsContext.accept();

    const publisher = serveGrip.getPublisher();
    // eslint-disable-next-line no-await-in-loop
    await publisher.publishFormats(CHANNEL_NAME,
      new WebSocketMessageFormat(JSON.stringify(wsContext)));

    wsContext.subscribe(CHANNEL_NAME);
  }

  while (wsContext.canRecv()) {
    const message = wsContext.recv();
    const publisher = serveGrip.getPublisher();

    if (message == null) {
      // If return value is undefined then connection is closed

      // eslint-disable-next-line no-await-in-loop
      await publisher.publishFormats(CHANNEL_NAME,
        new WebSocketMessageFormat(JSON.stringify(wsContext)));
      wsContext.close();
      break;
    }

    // Echo the message
    // const publisher = serveGrip.getPublisher();
    // eslint-disable-next-line no-await-in-loop
    await publisher.publishFormats(CHANNEL_NAME, new WebSocketMessageFormat(message));
  }

  // In Koa, specifically set the response body to null so that
  // it doesn't return 404
  ctx.response.body = null;
});

app.use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
