/* eslint-disable import/no-cycle */
import id from 'uniqid';
import Storage from './storage';
import App from './app';

export default class Modals {
  static show(modal, row) {
    if (row) {
      document.getElementById('title').value = row.querySelector('.list-item-title').textContent;
      document.getElementById('cost').value = row.querySelector('.list-item-cost').textContent;
      this.validity = { title: true, cost: true };
    }
    modal.classList.remove('hidden');
  }

  static save(button, row) {
    const name = document.getElementById('title').value;
    const cost = document.getElementById('cost').value;
    let data = Storage.getItems();
    if (row) {
      const target = data.find((item) => item.id.toString() === row.getAttribute('data-id'));
      target.name = name;
      target.cost = cost;
    } else {
      if (!data) {
        data = [];
      }
      data.push({ id: id(), name, cost });
    }
    Storage.setItems(data);
    App.update();
    Modals.cancel();
  }

  static delete(row) {
    Storage.setItems(
      // помещаем обратно в localStorage ту его часть, которая не совпадает по id с data-id
      Storage.getItems().filter((item) => item.id.toString() !== row.getAttribute('data-id')),
    );
    App.update();
    Modals.cancel();
  }

  static cancel() {
    Modals.reset();
    this.validity = { title: false, cost: false };
    document.querySelector('button.save').disabled = true;
    document.querySelectorAll('.error').forEach((message) => message.classList.add('hidden'));
    Array.from(document.querySelectorAll('.modal-container')).find((modal) => !modal.classList.contains('hidden')).classList.add('hidden');
  }

  static reset() {
    document.forms['add-and-update'].reset();
  }
}
