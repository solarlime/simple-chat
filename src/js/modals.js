import Storage from "./storage";
import App from "./app";
import id from 'uniqid';

export default class Modals {
  static show(modal, row) {
    if (row) {
      document.getElementById('title').value = row.querySelector('.list-item-title').textContent;
      document.getElementById('cost').value = row.querySelector('.list-item-cost').textContent;
    }
    modal.classList.remove('hidden');
  }

  static save(row) {
    const data = Storage.getItems();
    if (row) {
      const target = data.find((item) => item.id.toString() === row.getAttribute('data-id'));
      target.name = document.getElementById('title').value;
      target.cost = document.getElementById('cost').value;
    } else {
      data.push({
        id: id(),
        name: document.getElementById('title').value,
        cost: document.getElementById('cost').value
      });
    }
    Storage.setItems(data);
    App.update();
    Modals.cancel();
  }

  static delete(row) {
    Storage.setItems(
      // помещаем обратно в localStorage ту его часть, которая не совпадает по id с data-id
      Storage.getItems().filter((item) => item.id.toString() !== row.getAttribute('data-id'))
    );
    App.update();
    Modals.cancel();
  }

  static cancel() {
    Modals.reset();
    Array.from(document.querySelectorAll('.modal-container')).find((modal) => !modal.classList.contains('hidden')).classList.add('hidden');
  }

  static reset() {
    document.forms['add-and-update'].reset();
  }
}
