// ============================================
//  STOCKR — homePage.js
//  Location: src/main/resources/static/JS/
// ============================================

// Cursor
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  setTimeout(() => { trail.style.left = mx + 'px'; trail.style.top = my + 'px'; }, 90);
});

document.querySelectorAll('a,.feature-card,.bento-card,.stat,.tag-pill').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '26px'; cursor.style.height = '26px'; cursor.style.opacity = '.5';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '14px'; cursor.style.height = '14px'; cursor.style.opacity = '1';
  });
});

// Scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Counter animation
function countUp(el, target, dec, duration = 2200) {
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * ease).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const cObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target.querySelector('.stat-num');
      countUp(el, parseFloat(el.dataset.target), parseInt(el.dataset.dec));
      cObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat').forEach(el => cObs.observe(el));
