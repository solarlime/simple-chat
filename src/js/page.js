/* eslint-disable no-param-reassign */

import validator from 'validator/es';
import Utils from './utils';

export default class Page {
  // Определяем ключевые элементы и переменные
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
  }

  createWebSocket(reload = false) {
    this.ws = new WebSocket('wss://8bcbc7a2.fanoutcdn.com/api/ws');
    this.ws.binaryType = 'blob';
    this.addWebsocketListeners(reload);
  }

  /**
   * Обёртка для первого запуска WS: при повторных подключениях данные не должны очищаться
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
       * Обработчик закрытия страницы
       */
      window.addEventListener('beforeunload', () => {
        // Посылаем всем сообщение о разъединении
        this.ws.send(JSON.stringify({
          isMessage: false, connect: false, name: this.whoAmI,
        }));
        this.ws.close();
        const form = new FormData();
        form.append('name', this.whoAmI);
        // Посылаем запрос на удаление пользователя из базы. Navigator.sendBeacon()
        // плохо работает при закрытии браузера. Используем XMLHttpRequest
        // в синхронном режиме для более надёжной работы
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/http/mongo/delete/users', false);
        xhr.send(form);
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
   * Функция добавления обработчиков (не WS)
   */
  addMainListeners() {
    /**
     * Обработчик ввода данных
     */
    this.loginInput.addEventListener('input', () => {
      // Отсекаем лишние пробелы
      const input = this.loginInput.value.trim();
      // Проверяем на пустое поле
      if (validator.isEmpty(input)) {
        Utils.showError(this.error, this.loginButton, 'Write your username');
        return;
      }
      // Должны быть только буквы и цифры
      if (!validator.isAlphanumeric(input, 'ru-RU') && !validator.isAlphanumeric(input, 'en-US')) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: forbidden symbols');
        return;
      }
      // Но должна быть хотя бы одна буква
      if (validator.isNumeric(input)) {
        Utils.showError(this.error, this.loginButton, 'Incorrect username: no letters');
        return;
      }
      // И такого пользователя не должно быть уже в базе
      if (this.members.find((item) => item === input)) {
        Utils.showError(this.error, this.loginButton, 'This member is online');
        return;
      }
      this.error.classList.add('hidden');
      this.loginButton.disabled = false;
    });

    /**
     * Обработчики для поля и кнопки. Отправляют данные для авторизации
     */
    this.loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!this.loginButton.disabled) {
        this.loginWrapper.bind(this)(event);
      }
    });
    this.loginButton.addEventListener('click', this.loginWrapper.bind(this));

    /**
     * Обработчик отправки нового сообщения
     */
    this.sendForm.addEventListener('submit', Utils.sendFormHandler.bind(this));
  }

  /**
   * Функция добавления обработчиков (WS)
   * @param reload: отвечает за работу при переподключении
   */
  addWebsocketListeners(reload = false) {
    /**
     * Обработчик подключения к WS.
     * При успешном подключении посылает служебное сообщение о подключении
     */
    this.ws.addEventListener('open', (event) => {
      console.log('Connected to proxy!', event);
      this.ws.send(JSON.stringify({
        isMessage: false, connect: true, name: this.whoAmI,
      }));
    });

    /**
     * Обработчик получения сообщений
     */
    this.ws.addEventListener('message', (event) => {
      console.log('Received:', event);
      const data = JSON.parse(event.data);

      // Обрабатываем сообщения лишь если пользователь корректно подключён
      if (this.whoAmI && !data.openId) {
        // Если это пользовательское сообщение, отрисовываем
        if (data.isMessage) {
          Utils.render(this.chatArea, data, () => (data.name === this.whoAmI ? 'self' : 'others'));
          // Если это служебное сообщение + подключение не после перезагрузки, отрисовываем
        } else if (!reload) {
          Utils.renderService(this.chatArea, data, this.whoAmI, () => (data.connect ? '' : 'dis'));
          // При этом если сообщение говорит о разъединении, удаляем информацию о пользователе
          if (!data.connect) {
            this.members.splice(this.members.indexOf(data.name), 1);
            const deleteUser = Array.from(this.page.querySelectorAll('.online-member'))
              .find((item) => item.id === data.name);
            Utils.clear([deleteUser]);
          //  Иначе добавляем его, но проверяем: нет ли его уже из-за запроса к базе
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
     * Обработчик завершения соединения. Если это произошло не из-за закрытия, переподключаемся
     */
    this.ws.addEventListener('close', async (event) => {
      console.log('Connection closed:', event);

      this.sendButton.disabled = true;
      this.sendInput.disabled = true;
      this.ws = null;
      this.update(false);

      this.createWebSocket.bind(this, true);

      const cws = this.createWebSocket.bind(this, true);
      // const cws = this.loginWrapper.bind(this, event, true);
      const timeout = setTimeout(async () => {
        cws();
        const res = await Utils.fetchUsers();
        this.members = res.data;
        this.update(false);
        this.members.forEach((member) => Utils.renderUsers(this.usersArea, member));

        const users = this.page.querySelectorAll('.online-member');
        console.log(users.entries());
        clearTimeout(timeout);
      }, 5000);
    });

    /**
     * Обработчик ошибок подключения к WS
     */
    this.ws.addEventListener('error', () => {
      console.log('error');
    });
  }

  /**
   * Функция очистки столбцов с пользователями и сообщениями
   * @param all: по умолчанию очищаем пользователей + сообщения. Иначе - только пользователей
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
