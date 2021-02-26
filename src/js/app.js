/* eslint-disable import/no-cycle, no-unused-expressions */

import Page from './page';

export default class App {
  static async init() {
    try {
      const res = await fetch('https://simple-chat.solarlime.vercel.app/api/http/mongo/fetch/users');
      const members = await res.json();
      const page = new Page(members.data);
      page.addMainListeners();
    } catch (e) {
      console.log(e);
    }
  }
}
