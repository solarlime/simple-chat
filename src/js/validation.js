export default function validation(input) {
  const message = input.nextElementSibling;
  if (!input.validity.valid || input.validity.rangeUnderflow) {
    if (input.id === 'title') {
      if (input.validity.valueMissing) {
        message.textContent = 'Enter the name, please.';
      } else {
        message.textContent = 'This value is invalid.';
      }
      message.classList.remove('hidden');
    }
    if (input.id === 'cost') {
      if (input.validity.rangeUnderflow) {
        message.textContent = 'The number is invalid. Min value: 0.01.';
      } else {
        message.textContent = 'The value is not a number.';
      }
      message.classList.remove('hidden');
    }
    return false;
  }
  message.classList.add('hidden');
  return true;
}
