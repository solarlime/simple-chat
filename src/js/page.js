/* eslint-disable no-param-reassign */

import validator from 'validator/es';
import Utils from './utils';

export default class Page {
  constructor(members) {
    this.ws = null;
    this.page = document.body;
    this.chatArea = this.page.querySelector('ul.chat');

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
  }

  createWebSocket() {
    this.ws = new WebSocket('wss://8bcbc7a2.fanoutcdn.com/api/ws');
    this.ws.binaryType = 'blob';
    this.addWebsocketListeners();
  }

  addMainListeners() {
    this.loginInput.addEventListener('input', () => {
      const input = this.loginInput.value.trim();
      if (validator.isEmpty(input)) {
        Utils.showError(this.error, this.loginButton, 'Write your username');
        return;
      }
      if (!validator.isAlphanumeric(input, 'ru-RU') && !validator.isAlphanumeric(input, 'en-US')) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: forbidden symbols');
        return;
      }
      if (validator.isNumeric(input)) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: no letters');
        return;
      }
      if (this.members.find((item) => item === input)) {
        Utils.showError(this.error, this.loginButton, 'This member is online');
        return;
      }
      this.error.classList.add('hidden');
      this.loginButton.disabled = false;
    });

    async function loginWrapper(event) {
      event.preventDefault();
      console.log(this.whoAmI);
      this.createWebSocket();
      this.update();
    }

    this.loginForm.addEventListener('submit', loginWrapper.bind(this));
    this.loginButton.addEventListener('click', loginWrapper.bind(this));

    this.sendForm.addEventListener('submit', Utils.sendFormHandler.bind(this));
  }

  addWebsocketListeners() {
    this.ws.addEventListener('open', (event) => {
      console.log('Connected to proxy!', event);
    });

    this.ws.addEventListener('message', async (event) => {
      console.log('Received:', event);
      const data = JSON.parse(event.data);

      if (data.openId) {
        this.whoAmI = await Utils.loginFormHandler(
          { id: data.openId, name: this.whoAmI }, this.loginInput, this.sendInput,
          this.sendButton, this.modalLogin, this.members,
        );
      }

      if (data.isMessage && this.whoAmI) {
        Utils.render(this.chatArea, data, () => (data.name === this.whoAmI ? 'self' : 'others'));
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log('Connection closed:', event);
      this.ws = null;
      const cws = this.createWebSocket.bind(this);
      setTimeout(cws, 5000);
    });

    this.ws.addEventListener('error', () => {
      console.log('error');
    });
  }

  update() {
    const users = this.page.querySelectorAll('.online-member');
    const messages = this.page.querySelectorAll('.chat-item-wrapper');
    if (users) Utils.clear(users);
    if (messages) Utils.clear(messages);
  }
}
