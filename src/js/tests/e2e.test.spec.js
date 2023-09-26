// @ts-check
import { WebSocketServer } from 'ws';
import { test, expect } from '@playwright/test';

test.describe('E2E', () => {
  let pageOne = null;
  let pageTwo = null;

  test.describe.configure({ mode: 'parallel' });

  test.beforeAll(async ({ browser }) => {
    pageOne = await browser.newPage();
    pageTwo = await browser.newPage();
  });

  test.afterAll(async () => {
    await pageOne.close();
    await pageTwo.close();
  });

  test.describe('A set of tests', async () => {
    const fetchMock = async (page, name = undefined) => {
      await page.route('http://localhost:3002/simple-chat/fetch/', (route) => route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'Read',
          data: (name) ? [{ name }] : [],
        }),
      }));
    };

    test('Check login screen', async () => {
      await fetchMock(pageOne, 'Harry');
      await pageOne.goto('/');

      const loginInputOne = await pageOne.locator('#login');
      const loginErrorOne = await pageOne.locator('span.error-name');
      const loginButtonOne = await pageOne.locator('button.continue');
      const alertOne = await pageOne.locator('div.alert');

      // At first, button should be disabled and error label should be hidden
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeHidden();

      // Spaces before and after a name are ignored
      await loginInputOne.fill('Harry');
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeVisible();

      // Only spaces are forbidden
      await loginInputOne.fill('   ');
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeVisible();

      // Empty input is forbidden
      await loginInputOne.fill('');
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeVisible();

      // Less than 20 symbols
      await loginInputOne.fill('BenjaminWalterHenryBarnes');
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeVisible();

      // Symbols or numbers are forbidden
      await loginInputOne.fill('Ben)');
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeVisible();

      // Spaces inside are forbidden
      await loginInputOne.fill('Ben Barnes');
      await expect(loginButtonOne).toBeDisabled();
      await expect(loginErrorOne).toBeVisible();

      // Spaces before and after a name are ignored
      await loginInputOne.fill('  Ben');
      await expect(loginButtonOne).toBeEnabled();
      await expect(loginErrorOne).toBeHidden();

      // Somebody logs in at the same time with the same name
      await loginButtonOne.click();
      await fetchMock(pageOne, 'Ben');
      await expect(alertOne).toBeVisible();
    });

    test('Try to communicate', async () => {
      await Promise.all([
        fetchMock(pageOne).then(() => pageOne.goto('/')),
        fetchMock(pageTwo).then(() => pageTwo.goto('/')),
      ]);

      const loginInputOne = await pageOne.locator('#login');
      const loginButtonOne = await pageOne.locator('button.continue');

      const loginInputTwo = await pageTwo.locator('#login');
      const loginButtonTwo = await pageTwo.locator('button.continue');

      // A listener function for WebSockets
      const wsLogic = async (ws, page) => {
        console.log('WebSocket initiated');
        ws.on('framereceived', async (event) => {
          const payload = JSON.parse(event.payload.toString());
          console.log(`${page} got from a server:`, payload);
        });
        ws.on('close', () => console.log('WebSocket closed'));
      };

      // Define mocking WebSocket server
      const socketServer = new WebSocketServer({ port: 3002 });
      socketServer.on('connection', (ws) => {
        ws.on('message', (data) => {
          socketServer.clients.forEach((client) => {
            client.send(data.toString());
          });
        });
        ws.on('close', () => {
          socketServer.clients.forEach((client) => {
            client.send(JSON.stringify({
              isMessage: false,
              data: {
                connect: false,
                name: 'Harry',
              },
            }));
          });
        });
      });

      pageOne.on('websocket', (ws) => wsLogic(ws, 'Ben (pageOne)'));

      await loginInputOne.fill('Ben');
      await loginButtonOne.click();
      await fetchMock(pageOne);

      // Connection notification on the first page
      const pageOneConnected = await pageOne.locator('div.connect');
      await expect(pageOneConnected).toHaveText('You connected!');

      // Users list on the first page
      const pageOneSide = await pageOne.locator('ul.online > li');
      await expect(pageOneSide).toContainText('Ben');

      pageTwo.on('websocket', (ws) => wsLogic(ws, 'Harry (pageTwo)'));

      await loginInputTwo.fill('Harry');
      await loginButtonTwo.click();
      await fetchMock(pageTwo, 'Ben');

      // Connection notification on the second page
      const pageTwoConnected = await pageTwo.locator('div.connect');
      await expect(pageTwoConnected).toHaveText('You connected!');

      // Users list on the second page
      const pageTwoSide = await pageTwo.locator('ul.online > li');
      await expect(pageTwoSide).toContainText(['Ben', 'Harry']);

      // At the same time the first page should change too
      const pageOneOtherConnected = await pageOne.locator('div.connect', { hasText: 'Harry' });
      await expect(pageOneOtherConnected).toHaveText('Harry connected!');
      await expect(pageOneSide).toContainText(['Ben', 'Harry']);

      const inputOne = await pageOne.locator('#input');
      const sendButtonOne = await pageOne.locator('#send');
      await expect(sendButtonOne).toBeDisabled;

      const text = 'Hello, Harry!';
      await inputOne.type(text);
      await expect(sendButtonOne).toBeEnabled;

      await sendButtonOne.click();
      // A new message should be rendered correctly on the first page...
      const newMessageOne = await pageOne.locator('div.self');
      await expect(newMessageOne).toContainText(text);

      // ...and on the second too
      const newMessageTwo = await pageTwo.locator('div.others');
      await expect(newMessageTwo).toContainText(text);

      // Let's try to open a copying popup...
      await newMessageTwo.click({ delay: 2500 });
      const popup = await pageTwo.locator('div.alert');
      await expect(popup)
        .toContainText('Do you want to copy the message?');

      // ...close it
      const cancel = await pageTwo.locator('button.cancel');
      cancel.click();
      await expect(popup).not.toBeVisible();

      // For now, I don't test copying due to problems with access in different browsers

      await pageTwo.close();
      // User disconnection
      const disconnectionMessageOne = await pageOne.locator('div.disconnect');
      await expect(disconnectionMessageOne).toHaveText('Harry disconnected!');
      await expect(pageOneSide).not.toContainText('Harry');
      socketServer.close();
    });
  });
});
