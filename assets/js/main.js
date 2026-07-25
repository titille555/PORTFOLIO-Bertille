/**
 * Main JavaScript File - Portfolio of Semagnon Akpéné Bertille
 * Features: Scroll Reveal, Animated Counters, Mobile Menu, Interactive PetroStock Gallery,
 * Symmetrical Nurse Route 4-Quadrant Radar Widget, Formspree Contact Handling.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollReveal();
  initStatCounters();
  initPetroGallery();
  initNurseRadarWidget();
  initContactForm();
  initActiveNavLink();
});

/* ==========================================================================
   1. MOBILE MENU DRAWER
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menuDrawer = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('close-menu-btn');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !menuDrawer) return;

  function openMenu() {
    menuDrawer.classList.remove('translate-x-full');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('overflow-hidden');
  }

  function closeMenu() {
    menuDrawer.classList.add('translate-x-full');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('overflow-hidden');
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuDrawer.classList.contains('translate-x-full')) {
      closeMenu();
    }
  });
}

/* ==========================================================================
   2. SCROLL REVEAL ANIMATIONS
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.15
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   3. ANIMATED KEY STATISTICS COUNTERS
   ========================================================================== */
function initStatCounters() {
  const counterElements = document.querySelectorAll('.stat-counter');

  const observerOptions = {
    threshold: 0.4
  };

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counterElements.forEach(el => counterObserver.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.getAttribute('data-target'));
  const duration = parseInt(el.getAttribute('data-duration') || '2000', 10);
  const prefix = el.getAttribute('data-prefix') || '';
  const suffix = el.getAttribute('data-suffix') || '';
  const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * easeProgress;

    let formattedValue;
    if (decimals > 0) {
      formattedValue = currentValue.toFixed(decimals).replace('.', ',');
    } else {
      formattedValue = Math.floor(currentValue).toLocaleString('fr-FR');
    }

    el.textContent = `${prefix}${formattedValue}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      let finalVal = decimals > 0 ? target.toFixed(decimals).replace('.', ',') : target.toLocaleString('fr-FR');
      el.textContent = `${prefix}${finalVal}${suffix}`;
    }
  }

  window.requestAnimationFrame(step);
}

/* ==========================================================================
   4. PETROSTOCK SCREENSHOT GALLERY & MODAL PREVIEW
   ========================================================================== */
function initPetroGallery() {
  const mainImage = document.getElementById('petro-main-img');
  const mainCaption = document.getElementById('petro-img-caption');
  const galleryThumbs = document.querySelectorAll('.petro-thumb-btn');
  const modal = document.getElementById('petro-modal');
  const modalImg = document.getElementById('petro-modal-img');
  const modalCaption = document.getElementById('petro-modal-caption');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const zoomBtn = document.getElementById('petro-zoom-btn');

  if (!mainImage) return;

  galleryThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.getAttribute('data-src');
      const caption = thumb.getAttribute('data-caption');

      galleryThumbs.forEach(t => {
        t.classList.remove('border-amber-500', 'ring-2', 'ring-amber-500/50');
        t.classList.add('border-slate-700');
      });
      thumb.classList.remove('border-slate-700');
      thumb.classList.add('border-amber-500', 'ring-2', 'ring-amber-500/50');

      mainImage.style.opacity = '0.3';
      setTimeout(() => {
        mainImage.src = src;
        mainCaption.textContent = caption;
        mainImage.style.opacity = '1';
      }, 150);
    });
  });

  function openModal() {
    if (!modal || !modalImg) return;
    modalImg.src = mainImage.src;
    if (modalCaption) modalCaption.textContent = mainCaption.textContent;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }

  if (zoomBtn) zoomBtn.addEventListener('click', openModal);
  if (mainImage) mainImage.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

/* ==========================================================================
   5. SYMMETRICAL 4-QUADRANT RADAR WIDGET (TCVRP - ROUTAGE D'INFIRMIÈRES)
   Each quadrant encodes identical symmetrical metrics:
   [Patients Restants / Visités], [Distance au plus proche], [Statut temporel]
   ========================================================================== */
function initNurseRadarWidget() {
  const quadrantInfoText = document.getElementById('radar-quadrant-desc');
  const quadrantButtons = document.querySelectorAll('.radar-q-btn');
  const nurseStateBadge = document.getElementById('radar-nurse-state');
  const patientsCountBadge = document.getElementById('radar-patients-count');
  const distanceBadge = document.getElementById('radar-distance-badge');

  if (!quadrantInfoText) return;

  // Symmetrical state representations across all 4 sectors around the nurse
  const quadrantData = {
    avant: {
      name: "AVANT (0° à 90° dans l'axe de marche)",
      patientsRestants: 3,
      patientsVisites: 1,
      distNearest: "1,2 km",
      timeStatus: "À l'heure (Fenêtre 08h30 — 09h30)",
      timeBadgeClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      desc: "Secteur frontal de navigation : 3 patients restants à visiter. Le plus proche se trouve à 1,2 km avec une fenêtre de soins respectée."
    },
    droite: {
      name: "DROITE (90° à 180° secteur Est)",
      patientsRestants: 2,
      patientsVisites: 2,
      distNearest: "2,4 km",
      timeStatus: "Précoce (Fenêtre 10h00 — 11h30)",
      timeBadgeClass: "text-teal-300 border-teal-500/30 bg-teal-500/10",
      desc: "Secteur latéral droit : 2 patients restants. Le plus proche est à 2,4 km avec une arrivée possible avant l'ouverture de la fenêtre (attente minimale)."
    },
    arriere: {
      name: "ARRIÈRE (180° à 270° secteur Sud)",
      patientsRestants: 1,
      patientsVisites: 4,
      distNearest: "3,8 km",
      timeStatus: "À l'heure (Fenêtre 11h00 — 12h00)",
      timeBadgeClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      desc: "Secteur arrière : 4 patients déjà visités et 1 patient restant isolé à 3,8 km (arbitrage de détour évalué par le DQN)."
    },
    gauche: {
      name: "GAUCHE (270° à 360° secteur Ouest)",
      patientsRestants: 2,
      patientsVisites: 1,
      distNearest: "0,9 km",
      timeStatus: "Risque de Retard (Fenêtre souple max 09h15)",
      timeBadgeClass: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      desc: "Secteur latéral gauche : Patient très proche à 0,9 km mais avec un risque de pénalité horaire si non servi rapidement."
    }
  };

  function renderQuadrantState(qKey) {
    const data = quadrantData[qKey];
    if (!data) return;

    // Highlight active quadrant button
    quadrantButtons.forEach(b => {
      b.classList.remove('bg-teal-500/30', 'border-teal-400', 'text-teal-300');
      b.classList.add('bg-slate-800/60', 'border-slate-700', 'text-slate-300');
    });
    const activeBtn = document.querySelector(`.radar-q-btn[data-quadrant="${qKey}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-slate-800/60', 'border-slate-700', 'text-slate-300');
      activeBtn.classList.add('bg-teal-500/30', 'border-teal-400', 'text-teal-300');
    }

    // Update symmetrical UI panels
    quadrantInfoText.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <strong class="text-teal-300 font-mono text-xs">${data.name}</strong>
        <span class="px-2 py-0.5 text-[10px] font-mono rounded border ${data.timeBadgeClass}">${data.timeStatus}</span>
      </div>
      <p class="text-slate-300 text-xs leading-relaxed mb-3">${data.desc}</p>
      <div class="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-center">
        <div>
          <span class="block text-slate-400 text-[10px]">Restants / Visités</span>
          <span class="text-teal-300 font-bold">${data.patientsRestants} restants / ${data.patientsVisites} visités</span>
        </div>
        <div>
          <span class="block text-slate-400 text-[10px]">Distance Plus Proche</span>
          <span class="text-amber-400 font-bold">${data.distNearest}</span>
        </div>
        <div>
          <span class="block text-slate-400 text-[10px]">Statut Temporel</span>
          <span class="text-slate-200 font-bold">${data.timeStatus.split(' ')[0]}</span>
        </div>
      </div>
    `;

    if (nurseStateBadge) nurseStateBadge.textContent = `Patient le plus proche : ${data.distNearest}`;
    if (patientsCountBadge) patientsCountBadge.textContent = `${data.patientsRestants} patients restants`;
    if (distanceBadge) distanceBadge.textContent = `Secteur : ${data.distNearest}`;

    // Highlight SVG sector polygon
    ['avant', 'droite', 'arriere', 'gauche'].forEach(key => {
      const polygon = document.getElementById(`svg-quadrant-${key}`);
      if (polygon) {
        if (key === qKey) {
          polygon.setAttribute('fill-opacity', '0.35');
          polygon.setAttribute('stroke', '#39C2AA');
          polygon.setAttribute('stroke-width', '2');
        } else {
          polygon.setAttribute('fill-opacity', '0.08');
          polygon.setAttribute('stroke', '#1E2D4A');
          polygon.setAttribute('stroke-width', '1');
        }
      }
    });
  }

  quadrantButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const qKey = btn.getAttribute('data-quadrant');
      renderQuadrantState(qKey);
    });
  });

  // Initialize with 'avant' sector
  renderQuadrantState('avant');
}

/* ==========================================================================
   6. FORMSPREE CONTACT FORM & CLIENT-SIDE VALIDATION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const actionUrl = form.getAttribute('action');
    
    if (actionUrl.includes('YOUR_FORMSPREE_ID')) {
      const email = document.getElementById('email')?.value || '';
      const name = document.getElementById('name')?.value || '';
      const message = document.getElementById('message')?.value || '';
      
      const mailtoUrl = `mailto:bertillesemagnon@gmail.com?subject=Contact%20Portfolio%20de%20${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AEmail:%20${encodeURIComponent(email)}`;
      
      if (formStatus) {
        formStatus.className = 'p-4 mb-4 text-sm rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40';
        formStatus.innerHTML = `
          <strong>Remarque :</strong> L'ID Formspree n'est pas encore configuré.<br>
          <a href="${mailtoUrl}" class="underline font-semibold hover:text-white">Cliquez ici pour envoyer directement via mailto:bertillesemagnon@gmail.com</a>
        `;
        formStatus.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Envoi en cours...
      `;
    }

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        if (formStatus) {
          formStatus.className = 'p-4 mb-4 text-sm rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40';
          formStatus.textContent = 'Merci ! Votre message a été envoyé avec succès à Bertille.';
          formStatus.classList.remove('hidden');
        }
        form.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l’envoi');
      }
    } catch (err) {
      if (formStatus) {
        formStatus.className = 'p-4 mb-4 text-sm rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40';
        formStatus.textContent = `Une erreur s'est produite : ${err.message}. Vous pouvez écrire directement à bertillesemagnon@gmail.com.`;
        formStatus.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Envoyer le message</span>
          <svg class="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        `;
      }
    }
  });
}

/* ==========================================================================
   7. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
   ========================================================================== */
function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('text-amber-400', 'border-b-2', 'border-amber-400');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('text-amber-400', 'border-b-2', 'border-amber-400');
      }
    });
  });
}
