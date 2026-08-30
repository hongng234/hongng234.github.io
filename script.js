const toggle = document.querySelector('.theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  toggle.textContent = document.body.classList.contains('light') ? '◑' : '◐';
});
