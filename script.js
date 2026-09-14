(() => {
  const header = document.getElementById('header');
  const nav = document.getElementById('navigation');
  const links = [...nav.querySelectorAll('a')];
  const toggle = document.querySelector('.menu-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px)');
  const progress = document.querySelector('.reading-progress span');
  const scenes = [...document.querySelectorAll('.scene')];
  const backgroundImages = [...document.querySelectorAll('.scene-image')];
  const journey = document.querySelector('.road-journey');
  const stops = [...document.querySelectorAll('.journey-stop')];
  const clamp = n => Math.min(1, Math.max(0, n));
  let scheduled = false;
  let roadProgress = 0;

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    toggle.querySelector('span').textContent = open ? '−' : '+';
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => setMenu(false)));

  // Visible content is the default. Only unseen, below-screen stops get an entrance.
  if (!reduced.matches) stops.forEach(stop => {
    if (stop.getBoundingClientRect().top > innerHeight) stop.classList.add('reveal-pending');
  });
  document.addEventListener('focusin', event => {
    event.target.closest('.reveal-pending')?.classList.remove('reveal-pending');
  });

  function render() {
    scheduled = false;
    const viewport = innerHeight;
    const scroll = scrollY;
    const distance = document.documentElement.scrollHeight - viewport;
    const rects = scenes.map(scene => scene.getBoundingClientRect());
    const frames = backgroundImages.map(image => image.parentElement.getBoundingClientRect());
    const journeyRect = journey.getBoundingClientRect();
    const stopRects = stops.map(stop => stop.getBoundingClientRect());
    let active = 0;
    rects.forEach((rect, index) => { if (rect.top <= 100) active = index; });
    links.forEach(link => {
      const chapter = link.hash === '#visit' ? 2 : link.hash === '#stop' ? 0 : 1;
      if (chapter === active && link.hash !== '#deli') link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    header.classList.toggle('light', desktop.matches && active === 2);
    header.classList.toggle('solid', desktop.matches && scroll > 24 && active !== 2);
    progress.style.transform = `scaleX(${distance > 0 ? clamp(scroll / distance) : 0})`;

    roadProgress = Math.max(roadProgress, clamp((viewport * .87 - journeyRect.top) / journeyRect.height));
    journey.style.setProperty('--road-progress', reduced.matches ? 1 : roadProgress.toFixed(4));
    stopRects.forEach((rect, index) => {
      const stop = stops[index];
      if (reduced.matches || rect.top < viewport * .94) stop.classList.remove('reveal-pending');
      if (rect.top > viewport || rect.bottom < 0) return;
      const drift = reduced.matches ? 0 : (clamp((viewport - rect.top) / (viewport + rect.height)) - .5) * (desktop.matches ? 22 : 10) * (index % 2 ? -1 : 1);
      stop.style.setProperty('--drift', `${drift.toFixed(2)}px`);
    });
    backgroundImages.forEach((image, index) => {
      const frame = frames[index];
      if (reduced.matches || !desktop.matches) { image.style.removeProperty('transform'); return; }
      if (frame.bottom <= 0 || frame.top >= viewport) return;
      const shift = (clamp((viewport - frame.top) / (viewport + frame.height)) - .5) * 30;
      image.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.06)`;
    });
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(render); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  desktop.addEventListener('change', () => { setMenu(false); schedule(); });
  reduced.addEventListener('change', () => {
    stops.forEach(stop => { stop.classList.remove('reveal-pending'); stop.style.setProperty('--drift', '0px'); });
    schedule();
  });
  new ResizeObserver(schedule).observe(journey);

  const viewer = document.querySelector('.photo-viewer');
  const viewerImage = viewer.querySelector('.viewer-image');
  const viewerCaption = viewer.querySelector('.viewer-caption');
  const photoButtons = [...document.querySelectorAll('[data-photo]')];
  let photoIndex = 0;
  let opener;
  function showPhoto(index) {
    photoIndex = (index + photoButtons.length) % photoButtons.length;
    const photo = photoButtons[photoIndex].querySelector('img');
    viewerImage.src = photo.src;
    viewerImage.alt = photo.alt;
    viewerCaption.textContent = `${photoIndex + 1} / ${photoButtons.length} · ${photo.alt}`;
  }
  photoButtons.forEach((button, index) => button.addEventListener('click', () => {
    opener = button;
    showPhoto(index);
    viewer.showModal();
  }));
  viewer.querySelector('.viewer-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const buttons = [...viewer.querySelectorAll('button')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  render();
})();
