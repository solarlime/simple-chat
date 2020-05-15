const puppeteer = require('puppeteer');
const { fork } = require('child_process');

jest.setTimeout(30000);
describe('E2E', () => {
  let browser = null;
  let page = null;
  let server = null;
  const url = 'http://localhost:9000';
  beforeAll(async () => {
    server = fork(`${__dirname}/e2e.server.js`);
    await new Promise((resolve, reject) => {
      server.on('error', () => {
        reject();
      });
      server.on('message', (message) => {
        if (message === 'ok') {
          resolve();
        }
      });
    });
    browser = await puppeteer.launch(
      {
        // headless: false,
        // slowMo: 100,
        // devtools: true,
      },
    );
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
    server.kill();
  });
  describe('Tests', () => {
    test('Add, update, delete', async () => {
      await page.goto(url);
      // Add
      const plus = await page.$('[class=title-container-plus]');
      plus.click();
      await page.waitFor(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      const name = await page.$('input[id=title]');
      await name.type('HTC HD2');
      const cost = await page.$('input[id=cost]');
      await cost.type('3000');
      const save = await page.$('button[class=save]');
      save.click();
      await page.waitFor(() => document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await page.waitFor(() => (document.querySelector('li.list-item .list-item-title').textContent === 'HTC HD2')
        && (document.querySelector('li.list-item .list-item-cost').textContent === '3000'));

      // Update
      const update = await page.$('svg[class=list-item-actions-update]');
      update.click();
      await page.waitFor(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await name.click({ clickCount: 3 });
      await name.type('Motorola Moto Z');
      await cost.click({ clickCount: 3 });
      await cost.type('15000');
      save.click();
      await page.waitFor(() => document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await page.waitFor(() => (document.querySelector('li.list-item .list-item-title').textContent === 'Motorola Moto Z')
        && (document.querySelector('li.list-item .list-item-cost').textContent === '15000'));

      // Delete
      const remove = await page.$('svg[class=list-item-actions-delete]');
      remove.click();
      await page.waitFor(() => !document.querySelector('div.modal-delete').classList.contains('hidden'));
      const destroy = await page.$('button[class=delete]');
      destroy.click();
      await page.waitFor(() => document.querySelector('div.modal-delete').classList.contains('hidden'));
      await page.waitFor(() => !(document.querySelector('li.list-item .list-item-title'))
        && !(document.querySelector('li.list-item .list-item-cost')));
    });
    test('Errors', async () => {
      await page.goto(url);
      // Add
      const plus = await page.$('[class=title-container-plus]');
      plus.click();
      await page.waitFor(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      const name = await page.$('input[id=title]');
      await name.type('1');
      await name.press('Backspace');
      await page.waitFor(() => !document.querySelector('.error-name').classList.contains('hidden'));
      const cost = await page.$('input[id=cost]');
      await cost.type('-1');
      await page.waitFor(() => !document.querySelector('.error-cost').classList.contains('hidden'));
      await page.waitFor(() => document.querySelector('.save').disabled);
    });
  });
});
