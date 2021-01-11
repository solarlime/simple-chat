/* eslint-disable no-param-reassign */

import validator from 'validator/es';
import Modals from './modals';

export default class Page {
  constructor() {
    this.page = document.body;
    this.modalLogin = this.page.querySelector('.modal-login');
    this.modalLoginButton = this.modalLogin.querySelector('button.continue');
    this.loginForm = this.modalLogin.querySelector('#login-form');
    this.loginInput = this.modalLogin.querySelector('#login');
    this.error = this.modalLogin.querySelector('.error-name');
    this.members = [{ name: 'Bruce' }, { name: 'Clark' }];
    this.modalLoginButton.disabled = true;
  }

  addListeners() {
    function showError(error, modalLoginButton, text) {
      error.textContent = text;
      error.classList.remove('hidden');
      modalLoginButton.disabled = true;
    }

    this.loginInput.addEventListener('input', () => {
      const input = this.loginInput.value.trim();
      if (validator.isEmpty(input)) {
        showError(this.error, this.modalLoginButton, 'Write your username');
        return;
      }
      if (!validator.isAlphanumeric(input, 'ru-RU') && !validator.isAlphanumeric(input, 'en-US')) {
        showError(this.error, this.modalLoginButton, 'Incorrect username: forbidden symbols');
        return;
      }
      if (validator.isNumeric(input)) {
        showError(this.error, this.modalLoginButton, 'Incorrect username: no letters');
        return;
      }
      if (this.members.find((item) => item.name === input)) {
        showError(this.error, this.modalLoginButton, 'This member is online');
        return;
      }
      this.error.classList.add('hidden');
      this.modalLoginButton.disabled = false;
    });

    function loginFormHandler(event) {
      event.preventDefault();
      const input = this.loginInput.value.trim();
      Modals.login(this.modalLogin, input, this.members);
    }

    this.loginForm.addEventListener('submit', loginFormHandler.bind(this));
    this.modalLoginButton.addEventListener('click', loginFormHandler.bind(this));
  }
}
