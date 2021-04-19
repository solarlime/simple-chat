/* eslint-disable import/no-cycle, no-unused-expressions */

import Page from './page';
import Utils from './utils';

export default class App {
  static async init() {
    document.querySelector('.reload')
      .addEventListener('click', () => window.location.reload());

    /**
     * A listener for resizing. Works good for mobiles
     */
    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    window.dispatchEvent(new Event('resize'));

    try {
      // At first - fetch the users, who's already connected
      const members = await Utils.fetchUsers();
      console.log(members.data);
      const response = await fetch('/api/fanout');
      const result = await response.json();
      console.log(result);
      if (result.error) {
        throw Error(result.error);
      }
      if (result.state === 'unsubscribed') {
        window.navigator.sendBeacon('/api/http/mongo/delete/users');
        members.data = [];
      }
      const page = new Page(members.data);
      page.addMainListeners();
    } catch (e) {
      Utils.alert('Oops! Something went wrong. Check your internet connection!');
    }
  }
}
