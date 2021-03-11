/* eslint-disable no-param-reassign, no-useless-catch */

import id from 'uniqid';

export default class Utils {
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
      return true;
    } catch (e) {
      throw e;
    }
  }

  static showError(error, loginButton, text) {
    error.textContent = text;
    error.classList.remove('hidden');
    loginButton.disabled = true;
  }

  static async loginFormHandler(user, loginInput, sendInput, sendButton, modalLogin, members) {
    user.name = loginInput.value.trim();
    sendInput.disabled = false;
    sendButton.disabled = false;
    try {
      await this.login(modalLogin, user, members);
      return user.name;
    } catch (e) {
      throw e;
    }
  }

  static sendFormHandler(event) {
    event.preventDefault();
    console.log(this);
    const input = this.sendInput.value.trim();
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

  static clear(items) {
    items.forEach((item) => item.remove());
  }
}
