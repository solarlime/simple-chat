/* eslint-disable class-methods-use-this */
import Storage from "./storage";
import Page from "./page";

export default class App {
  static init() {
    const page = new Page();
    App.update();
    page.addListeners();
  }

  static update() {
    Page.reset();
    document.querySelectorAll('li.list-item').forEach((item) => item.remove());
    Storage.getItems().forEach((item) => Page.render(item));
  }
}
