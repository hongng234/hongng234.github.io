const toggle = document.querySelector('.theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  toggle.textContent = document.body.classList.contains('light') ? '◑' : '◐';
});

// ===== BACK TO TOP =====
const toTop = document.createElement('button');
toTop.className = 'to-top';
toTop.type = 'button';
toTop.setAttribute('aria-label', 'Back to top of page');
toTop.textContent = '↑';
document.body.appendChild(toTop);
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
const toggleToTop = () => toTop.classList.toggle('is-visible', window.scrollY > 400);
window.addEventListener('scroll', toggleToTop, { passive: true });
toggleToTop();

// ===== VISUAL / HORIZONTAL GALLERY =====
const gallery = document.querySelector('.gallery-viewport');
const track = document.querySelector('.gallery-track');
const previous = document.querySelector('.gallery-prev');
const next = document.querySelector('.gallery-next');
const progress = document.querySelector('.gallery-progress span');

if (gallery && track && previous && next && progress) {
  const items = Array.from(track.querySelectorAll('.gallery-item'));
  const DRAG_THRESHOLD = 6;
  let position = 0;
  let pressed = false;
  let moved = false;
  let startX = 0;
  let startPosition = 0;
  let pressedItem = null;

  // Width of the gallery that is actually visible on screen. The viewport bleeds past
  // its section (negative margin), but the section's overflow:hidden and the window
  // edge clip it — so measure the real visible area instead of gallery.clientWidth.
  const section = gallery.closest('.gallery-section');
  const visibleWidth = () => {
    const rect = gallery.getBoundingClientRect();
    let right = Math.min(rect.right, document.documentElement.clientWidth);
    if (section) right = Math.min(right, section.getBoundingClientRect().right);
    return Math.max(0, right - rect.left);
  };
  const maxPosition = () => Math.max(0, track.scrollWidth - visibleWidth());
  const update = () => {
    position = Math.max(0, Math.min(position, maxPosition()));
    track.style.transform = `translateX(${-position}px)`;
    progress.style.width = `${maxPosition() ? 26 + (position / maxPosition()) * 74 : 100}%`;
    previous.disabled = position <= 0;
    next.disabled = position >= maxPosition() - 1;
  };
  const step = () => {
    const first = items[0];
    const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return first ? first.offsetWidth + gap : 360;
  };
  const moveBy = (amount) => { position += amount; update(); };

  previous.addEventListener('click', () => moveBy(-step()));
  next.addEventListener('click', () => moveBy(step()));

  // Drag to scroll — a short press without movement counts as a click (opens lightbox)
  gallery.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    pressed = true;
    moved = false;
    startX = event.clientX;
    startPosition = position;
    pressedItem = event.target.closest('.gallery-item');
    gallery.setPointerCapture(event.pointerId);
  });
  gallery.addEventListener('pointermove', (event) => {
    if (!pressed) return;
    const delta = event.clientX - startX;
    if (!moved && Math.abs(delta) < DRAG_THRESHOLD) return;
    if (!moved) { moved = true; gallery.classList.add('is-dragging'); }
    position = startPosition - delta;
    update();
  });
  const endPress = (event) => {
    if (!pressed) return;
    pressed = false;
    gallery.classList.remove('is-dragging');
    if (event.type === 'pointerup' && !moved && pressedItem) openLightbox(items.indexOf(pressedItem));
    pressedItem = null;
  };
  gallery.addEventListener('pointerup', endPress);
  gallery.addEventListener('pointercancel', endPress);

  // Horizontal trackpad / shift+wheel scrolling
  gallery.addEventListener('wheel', (event) => {
    const dx = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : (event.shiftKey ? event.deltaY : 0);
    if (!dx) return;
    event.preventDefault();
    gallery.classList.add('is-dragging');
    moveBy(dx);
    clearTimeout(gallery._wheelTimer);
    gallery._wheelTimer = setTimeout(() => gallery.classList.remove('is-dragging'), 120);
  }, { passive: false });

  // Keyboard access for each item
  items.forEach((item, index) => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    const label = item.querySelector('figcaption strong');
    item.setAttribute('aria-label', `Open image: ${label ? label.textContent : index + 1}`);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLightbox(index); }
    });
    item.addEventListener('focus', () => {
      // keep focused item in view
      const left = item.offsetLeft;
      const right = left + item.offsetWidth;
      if (left < position) { position = left; update(); }
      else if (right > position + visibleWidth()) { position = right - visibleWidth(); update(); }
    });
  });

  // ===== LIGHTBOX =====
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close">×</button>
    <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">←</button>
    <figure class="lightbox-figure">
      <img class="lightbox-img" alt="" />
      <figcaption class="lightbox-caption"><span></span><strong></strong><em></em></figcaption>
    </figure>
    <button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">→</button>`;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbTag = lightbox.querySelector('.lightbox-caption span');
  const lbTitle = lightbox.querySelector('.lightbox-caption strong');
  const lbCount = lightbox.querySelector('.lightbox-caption em');
  const lbFigure = lightbox.querySelector('.lightbox-figure');
  let current = -1;
  let lastFocus = null;

  const show = (index) => {
    current = (index + items.length) % items.length;
    const item = items[current];
    const img = item.querySelector('img');
    const tag = item.querySelector('figcaption span');
    const title = item.querySelector('figcaption strong');
    lbFigure.classList.remove('is-loaded');
    lbImg.onload = () => lbFigure.classList.add('is-loaded');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    if (lbImg.complete) lbFigure.classList.add('is-loaded');
    lbTag.textContent = tag ? tag.textContent : '';
    lbTitle.textContent = title ? title.textContent : '';
    lbCount.textContent = `${String(current + 1).padStart(2, '0')} — ${String(items.length).padStart(2, '0')}`;
  };

  function openLightbox(index) {
    if (index < 0) return;
    lastFocus = document.activeElement;
    show(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lightbox-lock');
    lightbox.querySelector('.lightbox-close').focus({ preventScroll: true });
  }
  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('lightbox-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };

  // Click outside the image (on the backdrop) closes
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target === lbFigure) closeLightbox();
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    else if (event.key === 'ArrowLeft') show(current - 1);
    else if (event.key === 'ArrowRight') show(current + 1);
    else if (event.key === 'Tab') {
      const focusables = lightbox.querySelectorAll('button');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Swipe left/right on touch devices
  let touchX = null;
  lightbox.addEventListener('touchstart', (event) => { touchX = event.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  window.addEventListener('resize', update);
  update();
}
