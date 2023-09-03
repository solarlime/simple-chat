/* eslint-disable no-param-reassign */

import validator from 'validator/es';
import Utils from './utils';

export default class Page {
  // Define the key moments & variables
  constructor(serverHost, members) {
    this.serverHost = serverHost;
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
    this.loginInput.placeholder = 'Write your username';
    this.loginInput.disabled = false;
    this.loginInput.focus();
    this.update();
  }

  /**
   * A wrapper for creating a WS connection
   */
  createWebSocket() {
    this.ws = new WebSocket(`${(() => {
      const { hostname } = window.location;
      return (hostname === 'localhost') ? `ws://${hostname}:3002` : 'wss://nginx.solarlime.dev';
    })()}/simple-chat/connect/`);
    this.ws.binaryType = 'blob';
    this.addWebsocketListeners();
  }

  /**
   * A wrapper for the first WS launch: data won't get cleared on reload
   * @param event
   */
  async loginWrapper(event) {
    event.preventDefault();
    try {
      this.loginButton.disabled = true;
      this.loginInput.disabled = true;
      this.whoAmI = await Utils.loginFormHandler(
        this.serverHost,
        { name: this.whoAmI },
        this.loginInput,
        this.sendInput,
        this.sendButton,
        this.modalLogin,
      );
      this.createWebSocket();
    } catch (e) {
      await Utils.alert(e);
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
      // Up to 20 symbols
      if (input.length > 20) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: too long');
        return;
      }
      // No existing users!
      if (this.members.find((item) => item.name === input)) {
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
     * Listeners for a login field & its button
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
   */
  addWebsocketListeners() {
    /**
     * A listener for connecting event
     * Sends a service message about it (if it's successful)
     */
    this.ws.addEventListener('open', async (event) => {
      console.log('Connected to proxy!', event);
      try {
        const fetched = await Utils.fetchUsers(this.serverHost);
        fetched.data.forEach((item) => {
          if (item.name) Utils.renderUsers(this.usersArea, item.name);
        });
      } catch (e) {
        await Utils.alert('A problem with rendering users occurred');
      }
      this.ws.send(JSON.stringify({
        isMessage: false,
        data: { connect: true, name: this.whoAmI },
      }));
    });

    /**
     * A listener for receiving messages
     */
    this.ws.addEventListener('message', (event) => {
      const body = JSON.parse(event.data);

      if (body.isMessage) {
        Utils.render(this.chatArea, body, () => (body.data.name === this.whoAmI ? 'self' : 'others'));
      } else {
        Utils.renderService(this.chatArea, body, this.whoAmI, () => (body.data.connect ? '' : 'dis'));
        if (body.data.connect) {
          Utils.renderUsers(this.usersArea, body.data.name);
        } else {
          const deleteUser = Array.from(this.page.querySelectorAll('.online-member'))
            .find((item) => item.id === body.data.name);
          Utils.clear([deleteUser]);
        }
      }
      this.sendButton.disabled = true;
      this.sendInput.disabled = false;
      this.sendInput.focus();
    });

    /**
     * A listener for closing connection. If there's a fault: reconnect
     */
    this.ws.addEventListener('close', async (event) => {
      console.log('Connection closed:', event);

      this.sendButton.disabled = true;
      this.sendInput.disabled = true;
      this.ws = null;
      this.update();
      await Utils.alert('You disconnected. Connect again!');
    });

    /**
     * A listener for different errors in WS
     */
    this.ws.addEventListener('error', (e) => {
      console.log(e);
    });
  }

  /**
   * A function for clearing areas with users & messages
   */
  update() {
    const messages = this.page.querySelectorAll('.chat-item-wrapper');
    if (messages) Utils.clear(messages);
    const users = this.page.querySelectorAll('.online-member');
    if (users) Utils.clear(users);
  }
}
