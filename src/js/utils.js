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

    // Listeners for triggering copying logic
    [{ down: 'mousedown', up: 'mouseup' }, { down: 'touchstart', up: 'touchend' }].forEach((events) => {
      let copyTimeout;

      chatItem.addEventListener(events.down, async (event) => {
        event.preventDefault();
        copyTimeout = setTimeout(async () => {
          await Utils.alert('Do you want to copy the message?', true, body.data.value);
          clearTimeout(copyTimeout);
        }, 1000);
      });

      chatItem.addEventListener(events.up, async (event) => {
        event.preventDefault();
        clearTimeout(copyTimeout);
      });
    });
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

  static _copyFallback(content) {
    const element = document.createElement('textarea');
    element.value = content;
    element.setAttribute('contenteditable', '');
    element.setAttribute('readonly', '');
    element.setAttribute('type', 'hidden');

    document.body.appendChild(element);

    element.select();
    element.setSelectionRange(0, element.value.length);
    document.execCommand('copy');

    document.body.removeChild(element);
  }

  /**
   * A function for showing alerts or confirmations
   * @param text
   * @param isConfirmation
   * @param content - message to copy
   */
  static async alert(text, isConfirmation = false, content = undefined) {
    const alertWrapper = document.querySelector('.alert-wrapper');
    const alertText = document.querySelector('.alert-text');
    const reloadContainer = document.querySelector('.alert-button-container');
    const copyContainer = document.querySelector('.copy-button-container');
    if (isConfirmation) {
      if (!reloadContainer.classList.contains('hidden')) {
        reloadContainer.classList.add('hidden');
      }
      if (copyContainer.classList.contains('hidden')) {
        copyContainer.classList.remove('hidden');
      }

      const copy = document.querySelector('.copy');
      const cancel = document.querySelector('.cancel');

      const copyListener = async () => {
        if (content !== undefined) {
          if (!navigator.clipboard) {
            // Fallback (ex. Safari 12)
            Utils._copyFallback(content);
          } else if (typeof ClipboardItem && navigator.clipboard.write) {
            // For Chrome & Safari
            const type = 'text/plain';
            const blob = new Blob([content], { type });
            const item = new ClipboardItem({ [type]: blob });
            await navigator.clipboard.write([item]);
          } else {
            // For Firefox
            await navigator.clipboard.writeText(content);
          }
          const oldText = copy.textContent;
          copy.textContent = '✓';
          cancel.disabled = true;
          const timeout = setTimeout(() => {
            cancel.dispatchEvent(new Event('click'));
            copy.textContent = oldText;
            cancel.disabled = false;
            clearTimeout(timeout);
          }, 1000);
        }
      };

      copy.addEventListener('click', copyListener, { once: true });

      cancel.addEventListener('click', () => {
        copy.removeEventListener('click', copyListener);
        copyContainer.classList.add('hidden');
        alertWrapper.classList.add('hidden');
      }, { once: true });
    } else {
      if (reloadContainer.classList.contains('hidden')) {
        reloadContainer.classList.remove('hidden');
      }
      if (!copyContainer.classList.contains('hidden')) {
        copyContainer.classList.add('hidden');
      }

      const reload = document.querySelector('.reload');
      reload.addEventListener('click', () => { window.location.reload(); }, { once: true });
    }
    alertWrapper.classList.remove('hidden');
    alertText.textContent = text;
  }
}
