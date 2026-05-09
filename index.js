/* ============================================
   The Call of the Stars — Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initStarField();
  initScrollAnimations();
  initNavigation();
});

/* --- Animated Star Field (Canvas) --- */
function initStarField() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const count = Math.floor((w * h) / 4000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.0008 + 0.0003,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.pageYOffset; }, { passive: true });

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const parallax = scrollY * 0.08;

    for (const s of stars) {
      const twinkle = Math.sin(time * s.speed + s.phase) * 0.3 + 0.7;
      const a = s.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, (s.y + parallax) % h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 215, 205, ${a})`;
      ctx.fill();

      if (s.r > 1.1) {
        ctx.beginPath();
        ctx.arc(s.x, (s.y + parallax) % h, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 83, ${a * 0.08})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  requestAnimationFrame(draw);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); createStars(); }, 200);
  });
}

/* --- Scroll Animations (Intersection Observer) --- */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.fade-in');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(t => observer.observe(t));
}

/* --- Navigation --- */
function initNavigation() {
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  // Scroll state
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile toggle
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const isOpen = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}
