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

    // It's necessary to recognise if the page is loaded locally or not to choose a server location
    let serverHost;
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost') {
      serverHost = `${protocol}//${hostname}:3002`;
    } else {
      serverHost = `${protocol}//nginx.solarlime.dev`;
    }

    try {
      // At first - fetch the users, who's already connected
      const members = await Utils.fetchUsers(serverHost);
      const page = new Page(serverHost, members.data);
      page.addMainListeners();
    } catch (e) {
      Utils.alert('Oops! Something went wrong. Check your internet connection!');
    }
  }
}
