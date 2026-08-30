const toggle = document.querySelector('.theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  toggle.textContent = document.body.classList.contains('light') ? '◑' : '◐';
});

// ===== VISUAL / HORIZONTAL GALLERY =====
const gallery = document.querySelector('.gallery-viewport');
const track = document.querySelector('.gallery-track');
const previous = document.querySelector('.gallery-prev');
const next = document.querySelector('.gallery-next');
const progress = document.querySelector('.gallery-progress span');

if (gallery && track && previous && next && progress) {
  let position = 0;
  let pressed = false;
  let startX = 0;
  let startPosition = 0;

  const maxPosition = () => Math.max(0, track.scrollWidth - gallery.clientWidth);
  const update = () => {
    position = Math.max(0, Math.min(position, maxPosition()));
    track.style.transform = `translateX(${-position}px)`;
    progress.style.width = `${maxPosition() ? 26 + (position / maxPosition()) * 74 : 100}%`;
  };
  const moveBy = (amount) => { position += amount; update(); };

  previous.addEventListener('click', () => moveBy(-360));
  next.addEventListener('click', () => moveBy(360));
  gallery.addEventListener('pointerdown', (event) => {
    pressed = true;
    startX = event.clientX;
    startPosition = position;
    gallery.setPointerCapture(event.pointerId);
  });
  gallery.addEventListener('pointermove', (event) => {
    if (!pressed) return;
    position = startPosition - (event.clientX - startX);
    update();
  });
  gallery.addEventListener('pointerup', () => { pressed = false; });
  gallery.addEventListener('pointercancel', () => { pressed = false; });
  window.addEventListener('resize', update);
  update();
}
