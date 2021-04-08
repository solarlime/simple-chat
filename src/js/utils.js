/* eslint-disable no-param-reassign, no-useless-catch */

import id from 'uniqid';

export default class Utils {
  /**
   * A simple function for fetching users from the DB
   * @returns {Promise<any>}
   */
  static async fetchUsers() {
    const res = await fetch('/api/http/mongo/fetch/users', {
      cache: 'no-cache',
    });
    return res.json();
  }

  /**
   * A function for signing in
   * @param modal - a login window
   * @param user - a user to sign in
   * @param members - an array of members (each of them are objects with fields - can be expanded)
   * @returns {Promise<*>}
   */
  static async login(modal, user, members) {
    try {
      const res = await fetch('/api/http/mongo/update/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify(user),
      });
      const json = await res.json();
      console.log(json);
      if (json.status === 'Added') {
        members = json.data;
        console.log(members);
      } else {
        throw new Error(json.data);
      }
      document.querySelector('.greeting').textContent = `You logged as ${user.name}`;
      modal.classList.add('hidden');
      return members;
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
   * @param user
   * @param loginInput
   * @param sendInput
   * @param sendButton
   * @param modalLogin
   * @param members
   * @returns {Promise<*[]>}
   */
  static async loginFormHandler(user, loginInput, sendInput, sendButton, modalLogin, members) {
    user.name = loginInput.value.trim();
    try {
      members = await this.login(modalLogin, user, members);
      return [user.name, members];
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
    console.log(this);
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
        isMessage: true, id: id(), name: this.whoAmI, date: resolveDate(), value: input,
      }));
    }
    this.sendForm.reset();
  }

  /**
   * A function to render standard messages
   * @param chatArea
   * @param data
   * @param callback - a simple function that defines the side to render
   */
  static render(chatArea, data, callback) {
    const side = callback();
    const chatItem = document.createElement('li');
    chatItem.setAttribute('class', 'chat-item-wrapper');
    chatItem.innerHTML = `<div class="chat-item chat-item-${side}"><div class="chat-item-text ${side}">\n`
        + `<div class="chat-item-text-description">${data.value}</div>\n`
        + `<div class="chat-item-text-extras">${data.name}, ${data.date}</div>\n`
        + '</div></div>';
    chatArea.insertAdjacentElement('beforeend', chatItem);
    chatItem.scrollIntoView(false);
  }

  /**
   * A function to render service messages
   * @param chatArea
   * @param data - an object with some service data
   * @param whoAmI
   * @param callback - a simple function that defines if the user connected/disconnected
   */
  static renderService(chatArea, data, whoAmI, callback) {
    const connected = callback();
    const chatItem = document.createElement('li');
    chatItem.setAttribute('class', 'chat-item-wrapper');
    const chatItemDiv = document.createElement('div');
    chatItemDiv.setAttribute('class', `chat-item chat-item-service ${connected}connect`);
    chatItemDiv.textContent = `${data.name === whoAmI ? 'You' : data.name} ${connected}connected!`;
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
