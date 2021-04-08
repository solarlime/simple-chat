/* eslint-disable no-param-reassign */

import validator from 'validator/es';
import MobileDetect from 'mobile-detect';
import Utils from './utils';

export default class Page {
  // Define the key moments & variables
  constructor(members) {
    this.ws = null;
    this.page = document.body;
    this.chatArea = this.page.querySelector('ul.chat');
    this.usersArea = this.page.querySelector('ul.online');

    this.modalLogin = this.page.querySelector('.modal-login');
    this.loginForm = this.modalLogin.querySelector('#login-form');
    this.loginInput = this.modalLogin.querySelector('#login');
    this.loginButton = this.modalLogin.querySelector('button.continue');
    this.error = this.modalLogin.querySelector('.error-name');

    this.sendForm = this.page.querySelector('#input-send-form');
    this.sendInput = this.page.querySelector('#input');
    this.sendButton = this.page.querySelector('#send');

    this.whoAmI = undefined;
    this.members = members;
    this.loginInput.placeholder = 'Enter the username';
    this.loginInput.disabled = false;
    this.loginInput.focus();
    this.update();

    this.detected = new MobileDetect(window.navigator.userAgent);
  }

  createWebSocket(reload = false) {
    this.ws = new WebSocket('wss://8bcbc7a2.fanoutcdn.com/api/ws');
    this.ws.binaryType = 'blob';
    this.addWebsocketListeners(reload);
  }

  /**
   * A wrapper for the first WS launch: data won't get cleared on reload
   * @param event
   * @param reload
   */
  async loginWrapper(event, reload = false) {
    event.preventDefault();
    try {
      console.log(this.loginButton);
      this.loginButton.disabled = true;
      this.loginInput.disabled = true;
      [this.whoAmI, this.members] = await Utils.loginFormHandler(
        { name: this.whoAmI }, this.loginInput, this.sendInput,
        this.sendButton, this.modalLogin, this.members,
      );
      console.log(this.members);
      this.createWebSocket(reload);

      /**
       * A listener for closing a page
       */
      window.addEventListener('beforeunload', () => {
        // Send a broadcast message about closing the tab
        this.ws.send(JSON.stringify({
          isMessage: false, connect: false, name: this.whoAmI,
        }));
        this.ws.close();
        const form = new FormData();
        form.append('name', this.whoAmI);
        if (!this.detected.mobile()) {
          // Send a request to delete a user from the DB. XMLHttpRequest's more reliable
          // on desktops but doesn't work on mobiles. Navigator.sendBeacon() works on closing
          // tabs on mobiles. And nothing works for browser closing on mobiles. A bug!
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/http/mongo/delete/users', false);
          xhr.send(form);
        } else {
          window.navigator.sendBeacon('/api/http/mongo/delete/users', form);
        }
      });

      const res = await Utils.fetchUsers();
      this.members = res.data;
      this.update(false);
      this.members.forEach((member) => Utils.renderUsers(this.usersArea, member));
      this.sendInput.focus();
    } catch (e) {
      Utils.alert(e);
    }
  }

  /**
   * A function for non-WS listeners
   */
  addMainListeners() {
    /**
     * Listeners for the data input
     */
    this.loginInput.addEventListener('input', () => {
      // Odd out the spaces
      const input = this.loginInput.value.trim();
      // Check for an empty input
      if (validator.isEmpty(input)) {
        Utils.showError(this.error, this.loginButton, 'Write your username');
        return;
      }
      // Must be only letters & numbers
      if (!validator.isAlphanumeric(input, 'ru-RU') && !validator.isAlphanumeric(input, 'en-US')) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: forbidden symbols');
        return;
      }
      // But there must be at least one letter
      if (validator.isNumeric(input)) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: no letters');
        return;
      }
      // No existing users!
      if (this.members.find((item) => item === input)) {
        Utils.showError(this.error, this.loginButton, 'This member is online');
        return;
      }
      this.error.classList.add('hidden');
      this.loginButton.disabled = false;
    });

    this.sendInput.addEventListener('input', () => {
      // Odd out the spaces
      const input = this.sendInput.value.trim();
      // Check for an empty input
      if (validator.isEmpty(input)) {
        this.sendButton.disabled = true;
        return;
      }
      this.sendButton.disabled = false;
    });

    /**
     * Listeners for login field & button. Send the auth data
     */
    this.loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!this.loginButton.disabled) {
        this.loginWrapper.bind(this)(event);
      }
    });
    this.loginButton.addEventListener('click', this.loginWrapper.bind(this));

    /**
     * A listener for sending a new message
     */
    this.sendForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!this.sendButton.disabled) {
        Utils.sendFormHandler.bind(this)(event);
      }
    });
  }

  /**
   * A function for adding WS listeners
   * @param reload: controls the behaviour on reloads
   */
  addWebsocketListeners(reload = false) {
    /**
     * A listener for connecting event
     * Sends a services message about it (if it's successful)
     */
    this.ws.addEventListener('open', (event) => {
      console.log('Connected to proxy!', event);
      this.ws.send(JSON.stringify({
        isMessage: false, connect: true, name: this.whoAmI,
      }));
    });

    /**
     * A listener for receiving messages
     */
    this.ws.addEventListener('message', (event) => {
      console.log('Received:', event);
      const data = JSON.parse(event.data);

      // Check, if the user is connected correctly
      if (this.whoAmI && !data.openId) {
        // Standard message? Render it!
        if (data.isMessage) {
          Utils.render(this.chatArea, data, () => (data.name === this.whoAmI ? 'self' : 'others'));
          // Service message + no reload? Render it! ('User connected/disconnected!')
        } else if (!reload) {
          Utils.renderService(this.chatArea, data, this.whoAmI, () => (data.connect ? '' : 'dis'));
          // Also if there's a disconnect, delete the data about the disconnected user
          if (!data.connect) {
            this.members.splice(this.members.indexOf(data.name), 1);
            const deleteUser = Array.from(this.page.querySelectorAll('.online-member'))
              .find((item) => item.id === data.name);
            Utils.clear([deleteUser]);
          //  Else (a connect) add him. BUT: check, if he doesn't exist in the base.
          //  It can happen if 2 users try to connect at the same time
          } else if (this.whoAmI !== data.name && !this.members.includes(data.name)) {
            this.members.push(data.name);
            Utils.renderUsers(this.usersArea, data.name);
          }
        }
      }
      this.sendButton.disabled = false;
      this.sendInput.disabled = false;
    });

    /**
     * A listener for clsing connection. If there's a fault: reconnect
     */
    this.ws.addEventListener('close', async (event) => {
      console.log('Connection closed:', event);

      this.sendButton.disabled = true;
      this.sendInput.disabled = true;
      this.ws = null;
      this.update(false);

      this.createWebSocket.bind(this, true);

      const cws = this.createWebSocket.bind(this, true);
      const timeout = setTimeout(async () => {
        cws();
        const res = await Utils.fetchUsers();
        this.members = res.data;
        this.update(false);
        this.members.forEach((member) => Utils.renderUsers(this.usersArea, member));
        clearTimeout(timeout);
      }, 5000);
    });

    /**
     * A listener for different errors in WS
     */
    this.ws.addEventListener('error', () => {
      console.log('error');
    });
  }

  /**
   * A function for clearing areas with users & messages
   * @param all: clear all by default. If false - only users
   */
  update(all = true) {
    if (all) {
      const messages = this.page.querySelectorAll('.chat-item-wrapper');
      if (messages) Utils.clear(messages);
    }
    const users = this.page.querySelectorAll('.online-member');
    if (users) Utils.clear(users);
  }
}
