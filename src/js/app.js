/* eslint-disable import/no-cycle, no-unused-expressions */

import Page from './page';
import Utils from './utils';

export default class App {
  static async init() {
    document.querySelector('.reload')
      .addEventListener('click', () => window.location.reload());

    /**
     * A listener for resizing. Works good for mobiles
     * A timeout is needed to deal with virtual keyboards.
     * Otherwise, this event fires too quickly
     */
    window.addEventListener('resize', () => {
      const resizer = setTimeout(() => {
        clearTimeout(resizer);
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }, 20);
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
