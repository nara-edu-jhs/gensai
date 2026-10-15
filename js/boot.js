document.addEventListener('DOMContentLoaded', () => {
  const gate = document.querySelector('#language-gate');
  const panel = document.querySelector('#location-panel');
  const control = document.querySelector('#language-control');
  const select = document.querySelector('#language');
  document.querySelectorAll('.language-choice').forEach(button => {
    button.addEventListener('click', () => {
      if (select) select.value = button.dataset.language || 'ja';
      if (gate) gate.hidden = true;
      if (control) control.hidden = false;
      if (panel) panel.hidden = false;
      document.querySelector('#location-title')?.focus();
    });
  });
});
