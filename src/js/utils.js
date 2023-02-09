/* eslint-disable no-param-reassign, no-useless-catch */

import id from 'uniqid';

export default class Utils {
  /**
   * A simple function for fetching users from the DB
   * @param serverHost - a host server
   * @returns {Promise<any>}
   */
  static async fetchUsers(serverHost) {
    const res = await fetch(`${serverHost}/simple-chat/fetch/`, {
      cache: 'no-cache',
    });
    return res.json();
  }

  /**
   * A function for signing in
   * @param serverHost - a host server
   * @param modal - a login window
   * @param user - a user to sign in
   * @returns {Promise<*>}
   */
  static async login(serverHost, modal, user) {
    try {
      await new Promise((resolve, reject) => {
        Utils.fetchUsers(serverHost).then((res) => {
          if (res.status === 'Read') {
            const doesExist = res.data.find((item) => item.name === user.name);
            if (!doesExist) {
              resolve({ status: 'Added', data: res.data });
            } else {
              reject(new Error(`User ${user.name}'s already added`));
            }
          }
        });
      });
      document.querySelector('.greeting').textContent = `You logged as ${user.name}`;
      modal.classList.add('hidden');
    } catch (e) {
      throw e;
    }
  }

  /**
   * A simple function to show errors on the login screen
   * @param error - an error field
   * @param loginButton
   * @param text - an error text
   */
  static showError(error, loginButton, text) {
    error.textContent = text;
    error.classList.remove('hidden');
    loginButton.disabled = true;
  }

  /**
   * A wrapper for a login() function
   * @param serverHost
   * @param user
   * @param loginInput
   * @param sendInput
   * @param sendButton
   * @param modalLogin
   * @returns {Promise<*[]>}
   */
  static async loginFormHandler(serverHost, user, loginInput, sendInput, sendButton, modalLogin) {
    user.name = loginInput.value.trim();
    try {
      await this.login(serverHost, modalLogin, user);
      return user.name;
    } catch (e) {
      throw e;
    }
  }

  /**
   * A function to send standard messages
   * @param event
   */
  static sendFormHandler(event) {
    event.preventDefault();
    const input = this.sendInput.value.trim();
    // Define the date
    const resolveDate = (() => {
      const now = new Date();
      const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timezone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
      };
      return now.toLocaleString('ru', options);
    });
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        isMessage: true,
        data: {
          id: id(), name: this.whoAmI, date: resolveDate(), value: input,
        },
      }));
    }
    this.sendForm.reset();
  }

  /**
   * A function to render standard messages
   * @param chatArea
   * @param body
   * @param callback - a simple function that defines the side to render
   */
  static render(chatArea, body, callback) {
    const side = callback();
    const chatItem = document.createElement('li');
    chatItem.setAttribute('class', 'chat-item-wrapper');

    const chatItemSide = document.createElement('div');
    chatItemSide.setAttribute('class', `chat-item chat-item-${side}`);

    const chatItemTextSide = document.createElement('div');
    chatItemTextSide.setAttribute('class', `chat-item-text ${side}`);

    const chatItemTextDescription = document.createElement('div');
    chatItemTextDescription.setAttribute('class', 'chat-item-text-description');
    chatItemTextDescription.textContent = `${body.data.value}`;

    const chatItemTextExtras = document.createElement('div');
    chatItemTextExtras.setAttribute('class', 'chat-item-text-extras');
    chatItemTextExtras.textContent = `${body.data.name}, ${body.data.date}`;

    chatItemTextSide.insertAdjacentElement('beforeend', chatItemTextDescription);
    chatArea.insertAdjacentElement('beforeend', chatItem)
      .insertAdjacentElement('beforeend', chatItemSide)
      .insertAdjacentElement('beforeend', chatItemTextSide)
      .insertAdjacentElement('beforeend', chatItemTextExtras);
    chatItem.scrollIntoView(false);
  }

  /**
   * A function to render service messages
   * @param chatArea
   * @param body - an object with some service data
   * @param whoAmI
   * @param callback - a simple function that defines if the user connected/disconnected
   */
  static renderService(chatArea, body, whoAmI, callback) {
    const connected = callback();
    const chatItem = document.createElement('li');
    chatItem.setAttribute('class', 'chat-item-wrapper');
    const chatItemDiv = document.createElement('div');
    chatItemDiv.setAttribute('class', `chat-item chat-item-service ${connected}connect`);
    chatItemDiv.textContent = `${body.data.name === whoAmI ? 'You' : body.data.name} ${connected}connected!`;
    chatItem.insertAdjacentElement('beforeend', chatItemDiv);
    chatArea.insertAdjacentElement('beforeend', chatItem);
    chatItem.scrollIntoView(false);
  }

  /**
   * A function to render users, who are online
   * @param onlineArea
   * @param member
   */
  static renderUsers(onlineArea, member) {
    const user = document.createElement('li');
    user.setAttribute('class', 'online-member');
    user.id = member;
    const userDiv = document.createElement('div');
    userDiv.setAttribute('class', 'online-member-name');
    userDiv.textContent = member;
    user.insertAdjacentElement('beforeend', userDiv);
    onlineArea.insertAdjacentElement('beforeend', user);
  }

  /**
   * Just a wrapper for a forEach
   * @param items
   */
  static clear(items) {
    items.forEach((item) => item.remove());
  }

  /**
   * A function for showing an alert
   * @param text
   */
  static alert(text) {
    document.querySelector('.alert-wrapper').classList.remove('hidden');
    document.querySelector('.alert-text').textContent = text;
  }
}
