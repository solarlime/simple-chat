export default class Storage {
  /**
   * PUT отправляет FormData: id, done, name, description, date
   * POST отправляет FormData: id, done или id, name, description
   * DELETE отправляет Formdata: id
   * GET не отправляет ничего в теле запроса
   */
  static request(command, data = '') {
    const actions = {
      new: { method: 'PUT', url: 'new' },
      update: { method: 'POST', url: 'update' },
      delete: { method: 'DELETE', url: 'delete' },
      fetch: { method: 'GET', url: 'fetch' },
    };
    const action = actions[command];
    const xhr = new XMLHttpRequest();
    xhr.open(action.method, `/backend?action=${action.url}`);
    if (action.method === 'GET') {
      xhr.send();
    } else {
      xhr.send(data);
    }
  }

  static getItems() {
    return JSON.parse(localStorage.getItem('items'));
  }

  static setItems(items) {
    localStorage.setItem('items', JSON.stringify(items));
  }
}
