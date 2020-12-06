/* eslint-disable import/no-cycle */
import id from 'uniqid';
import Storage from './storage';
import App from './app';

export default class Modals {
  static show(modal, row) {
    if (row) {
      document.getElementById('title').value = row.querySelector('.list-item-title').textContent;
      document.getElementById('description').value = row.querySelector('.list-item-description').textContent;
      this.validity = { title: true, description: true };
    }
    modal.classList.remove('hidden');
  }

  static quickSave(checkbox) {
    const row = checkbox.closest('li');
    const data = Storage.getItems();
    const target = data.find((item) => item.id.toString() === row.getAttribute('data-id'));
    target.done = checkbox.checked;
    Storage.setItems(data);

    // Sending a request
    const formData = new FormData();
    Object.entries({ id: row.getAttribute('data-id'), done: checkbox.checked })
      .forEach((field) => formData.append(field[0], field[1]));
    Storage.request('update', formData);
    App.update();
  }

  static save(button, row) {
    const name = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    let data = Storage.getItems();
    const formData = new FormData();
    if (row) {
      const target = data.find((item) => item.id.toString() === row.getAttribute('data-id'));
      target.name = name;
      target.description = description;

      // Sending a request
      Object.entries({ id: row.getAttribute('data-id'), name, description }).forEach((field) => formData.append(field[0], field[1]));
      Storage.request('update', formData);
    } else {
      if (!data) {
        data = [];
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
      data.push(newbie);

      // Sending a request
      Object.entries(newbie).forEach((field) => formData.append(field[0], field[1]));
      Storage.request('new', formData);
    }
    Storage.setItems(data);
    App.update();
    Modals.cancel();
  }

  static delete(row) {
    const formData = new FormData();
    formData.append('id', row.getAttribute('data-id'));
    Storage.request('delete', formData);
    Storage.setItems(
      // помещаем обратно в localStorage ту его часть, которая не совпадает по id с data-id
      Storage.getItems().filter((item) => item.id.toString() !== row.getAttribute('data-id')),
    );
    App.update();
    Modals.cancel();
  }

  static cancel() {
    Modals.reset();
    this.validity = { title: false, description: true };
    document.querySelector('button.save').disabled = true;
    document.querySelectorAll('.error').forEach((message) => message.classList.add('hidden'));
    Array.from(document.querySelectorAll('.modal-container')).find((modal) => !modal.classList.contains('hidden')).classList.add('hidden');
  }

  static reset() {
    document.forms['add-and-update'].reset();
  }
}
