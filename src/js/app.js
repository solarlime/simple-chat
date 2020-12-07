/* eslint-disable import/no-cycle, no-unused-expressions */

import Page from './page';

export default class App {
  static async init() {
    const page = new Page();
    await page.update(true);
    page.addListeners();
  }
}
