/* ===================================
   S.FIT ZONE GYM — MAIN SCRIPT
=================================== */

'use strict';

// ============== CONFIG ==============
const WA_NUMBER = '919910102049'; // Country code + number (no +)
const WA_DEFAULT_MSG = encodeURIComponent("Hi! I want to join S.fit Zone Gym. Please share more details. 💪");

// ============== NAVBAR ==============
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  // back to top
  const backTop = document.getElementById('back-top');
  if (window.scrollY > 400) backTop.classList.add('visible');
  else backTop.classList.remove('visible');
});

// ============== MOBILE MENU ==============
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});

mobileClose.addEventListener('click', closeMobileMenu);

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

function closeMobileMenu() {
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scroll = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) {
      if (scroll >= top && scroll < top + height) {
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-nav'));
        link.classList.add('active-nav');
      }
    }
  });
});

// ============== WHATSAPP BUTTON ==============
const waBtn = document.getElementById('whatsapp-btn');
waBtn.addEventListener('click', () => {
  // Track click (console log simulates analytics)
  console.log('[Analytics] WhatsApp click tracked');
  const url = `https://wa.me/${WA_NUMBER}?text=${WA_DEFAULT_MSG}`;
  window.open(url, '_blank');
});

// ============== SCROLL REVEAL ==============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============== GALLERY TABS ==============
const tabBtns = document.querySelectorAll('.tab-btn');
const galleryCards = document.querySelectorAll('.gallery-card');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    galleryCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = '';
        setTimeout(() => { card.style.opacity = '1'; card.style.transform = ''; }, 10);
      } else {
        card.style.opacity = '0';
        setTimeout(() => { card.style.display = 'none'; }, 300);
      }
    });
  });
});

// ============== LEAD FORM ==============
const joinForm = document.getElementById('join-form');

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('f-name').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const goal = document.getElementById('f-goal').value;
  const plan = document.getElementById('f-plan').value;

  // Basic validation
  if (!name || !phone || !goal) return;

  // Compose WhatsApp message with form data
  const msg = encodeURIComponent(
    `🏋️ NEW ENQUIRY — S.fit Zone Gym\n\n` +
    `👤 Name: ${name}\n` +
    `📞 Phone: ${phone}\n` +
    `🎯 Goal: ${goal}\n` +
    `💳 Interested Plan: ${plan || 'Not specified'}\n\n` +
    `Please contact me for more information. Thank you!`
  );

  console.log('[Analytics] Lead form submitted:', { name, phone, goal, plan });

  // Send to WhatsApp (lead capture)
  const waURL = `https://wa.me/${WA_NUMBER}?text=${msg}`;
  window.open(waURL, '_blank');

  // Show success message
  joinForm.style.display = 'none';
  document.getElementById('form-success').style.display = 'block';

  // Reset after 8 seconds
  setTimeout(() => {
    joinForm.reset();
    joinForm.style.display = 'block';
    document.getElementById('form-success').style.display = 'none';
  }, 8000);
});

// Phone number validation
const phoneInput = document.getElementById('f-phone');
phoneInput.addEventListener('input', () => {
  phoneInput.value = phoneInput.value.replace(/[^0-9+\-\s()]/g, '');
});

// ============== COUNTER ANIMATION ==============
function animateCounter(el, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      el.textContent = target + (el.dataset.suffix || '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start) + (el.dataset.suffix || '');
    }
  }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('[data-count]');
      counters.forEach(c => animateCounter(c, parseInt(c.dataset.count)));
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ============== BACK TO TOP ==============
const backTopBtn = document.getElementById('back-top');
backTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============== SMOOTH SCROLL FOR ANCHORS ==============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ============== PRICING: JOIN NOW ==============
document.querySelectorAll('.pricing-join').forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan;
    const msg = encodeURIComponent(`Hi! I want to join S.fit Zone Gym. I'm interested in the ${plan} plan. Please guide me! 💪`);
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  });
});

// ============== FREE TRIAL BTN ==============
document.querySelectorAll('.free-trial-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const msg = encodeURIComponent("Hi! I want to book a FREE TRIAL session at S.fit Zone Gym. Please let me know availability! 🏋️");
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  });
});
