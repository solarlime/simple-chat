export default function validation(input) {
  const message = input.nextElementSibling;
  if (!input.validity.valid || !input.value.trim()) {
    if (input.id !== 'title') {
      message.classList.add('hidden');
      return true;
    }
    if (input.validity.valueMissing) {
      message.textContent = 'Enter the name, please.';
    } else {
      message.textContent = 'This value is invalid.';
    }
    message.classList.remove('hidden');
    return false;
  }
  message.classList.add('hidden');
  return true;
}
