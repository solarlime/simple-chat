/* eslint-disable import/no-cycle, no-param-reassign */
import id from 'uniqid';
import Storage from './storage';

export default class Modals {
  /**
   * Функция открытия модального окна
   *
   * @param modal: нужное модальное окно
   * @param row (опционально): строка таблицы с пунктом, который необходимо изменить
   */
  static show(modal, row) {
    if (row) {
      modal.querySelector('#title').value = row.querySelector('.list-item-title').textContent;
      modal.querySelector('#description').value = row.querySelector('.list-item-description').textContent;
      this.validity = { title: true, description: true };
    }
    Modals.toggle(modal, true);
  }

  /**
   * Служебная функция для показа / скрытия модального окна
   *
   * @param modal: нужное модальное окно
   * @param status: true - показать окно, false - скрыть окно
   */
  static toggle(modal, status = false) {
    if (status === true) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  /**
   * Функция обработки нажатия на кнопку сохранения
   *
   * @param button: кнопка сохранения
   * @param row (если есть): строка таблицы с пунктом, который необходимо изменить
   * @param modal: нужное модальное окно (подразумевается .modal-add-update)
   * @param list: массив данных для изменения
   * @returns {Promise<void>}
   */
  static async save(button, row, modal, list) {
    const name = modal.querySelector('#title').value.trim();
    const description = modal.querySelector('#description').value.trim();
    const formData = new FormData();
    if (row) {
      const target = list.find((item) => item.id.toString() === row.getAttribute('data-id'));
      target.name = name;
      target.description = description;

      // Sending a request
      Object.entries({ id: row.getAttribute('data-id'), name, description }).forEach((field) => formData.append(field[0], field[1]));
      Modals.cancel(modal);
      await Storage.request('update', formData);
    } else {
      if (!list) {
        list = [];
      }
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
      const newbie = {
        id: id(), done: false, name, description, date: resolveDate(),
      };
      list.push(newbie);

      // Sending a request
      Object.entries(newbie).forEach((field) => formData.append(field[0], field[1]));
      Modals.cancel(modal);
      await Storage.request('new', formData);
    }
  }

  /**
   * Функция обработки нажатия на кнопку удаления
   *
   * @param row: строка таблицы с пунктом, который необходимо удалить
   * @param modal: нужное модальное окно (подразумевается .modal-delete)
   * @param list: массив данных для изменения
   * @returns {Promise<void>}
   */
  static async delete(row, modal, list) {
    const formData = new FormData();
    const dataId = row.getAttribute('data-id');
    formData.append('id', dataId);
    list.splice(list.findIndex((item) => item.id === dataId), 1);
    Modals.cancel(modal);
    await Storage.request('delete', formData);
  }

  /**
   * Функция-обёртка для закрытия модального окна
   *
   * @param modal: нужное модальное окно
   */
  static cancel(modal) {
    Modals.reset();
    Modals.toggle(modal);
  }

  /**
   * Функция-обёртка для сброса данных формы
   */
  static reset() {
    document.forms['add-and-update'].reset();
  }
}
