export default class Modals {
  static login(modal, user, members) {
    members.push({ name: user });
    document.querySelector('.greeting').textContent = `You logged as ${user}`;
    modal.classList.add('hidden');
  }
}
