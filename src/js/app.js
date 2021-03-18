/* eslint-disable import/no-cycle, no-unused-expressions */

import Page from './page';
import Utils from './utils';

export default class App {
  static async init() {
    document.querySelector('.reload')
      .addEventListener('click', () => window.location.reload());

    try {
      const res = await fetch('/api/http/mongo/fetch/users', {
        cache: 'no-cache',
      });
      const members = await res.json();
      console.log(members);
      const page = new Page(members.data);
      page.addMainListeners();
    } catch (e) {
      Utils.alert('Oops! Something went wrong. Check your internet connection!');
    }
  }
}
