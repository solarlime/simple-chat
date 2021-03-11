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

  createWebSocket(reload = false) {
    this.ws = new WebSocket('wss://8bcbc7a2.fanoutcdn.com/api/ws');
    this.ws.binaryType = 'blob';
    this.addWebsocketListeners(reload);
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
      try {
        this.whoAmI = await Utils.loginFormHandler(
          { name: this.whoAmI }, this.loginInput, this.sendInput,
          this.sendButton, this.modalLogin, this.members,
        );
        this.createWebSocket();
        this.update();

        window.addEventListener('unload', () => {
          this.ws.send(JSON.stringify({
            isMessage: false, connect: false, name: this.whoAmI,
          }));
          const form = new FormData();
          form.append('name', this.whoAmI);
          // Посылаем запрос на удаление пользователя из базы
          navigator.sendBeacon('/api/http/mongo/delete/users', form);
        });
      } catch (e) {
        alert(e);
        window.location.reload();
      }
    }

    this.loginForm.addEventListener('submit', loginWrapper.bind(this));
    this.loginButton.addEventListener('click', loginWrapper.bind(this));

    this.sendForm.addEventListener('submit', Utils.sendFormHandler.bind(this));
  }

  addWebsocketListeners(reload = false) {
    this.ws.addEventListener('open', (event) => {
      console.log('Connected to proxy!', event);
      this.ws.send(JSON.stringify({
        isMessage: false, connect: true, name: this.whoAmI,
      }));
    });

    this.ws.addEventListener('message', (event) => {
      console.log('Received:', event);
      const data = JSON.parse(event.data);

      if (this.whoAmI && !data.openId) {
        if (data.isMessage) {
          Utils.render(this.chatArea, data, () => (data.name === this.whoAmI ? 'self' : 'others'));
        } else if (!reload) {
          Utils.renderService(this.chatArea, data, this.whoAmI, () => (data.connect ? '' : 'dis'));
        }
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log('Connection closed:', event);
      this.ws = null;
      const cws = this.createWebSocket.bind(this, true);
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
