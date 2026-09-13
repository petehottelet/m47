const query = document.querySelector('#query');
const clear = document.querySelector('.clear');
const hint = document.querySelector('.key-hint');
const apps = document.querySelector('.apps');
const form = document.querySelector('form');

function syncInput() {
  clear.hidden = query.value.length === 0;
  hint.hidden = query.value.length > 0;
  query.setCustomValidity(
    query.value.length > 0 && !query.value.trim() ? 'Enter a search term.' : '',
  );
}
query.addEventListener('input', syncInput);
clear.addEventListener('click', () => {
  query.value = '';
  syncInput();
  query.focus();
});
form.addEventListener('submit', () => {
  query.value = query.value.trim();
  syncInput();
});
document.querySelectorAll('[data-query]').forEach((button) => {
  button.addEventListener('click', () => {
    query.value = button.dataset.query;
    syncInput();
    query.focus();
  });
});
document.addEventListener('keydown', (event) => {
  const editing =
    event.target instanceof HTMLElement &&
    (event.target.matches('input, textarea, select') || event.target.isContentEditable);
  if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    query.focus();
  }
  if (event.key === 'Escape' && apps.open) {
    apps.open = false;
    apps.querySelector('summary').focus();
  }
});
document.addEventListener('click', (event) => {
  if (!apps.contains(event.target)) apps.open = false;
});
syncInput();
