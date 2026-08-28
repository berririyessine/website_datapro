/** @odoo-module **/
// ═══════════════════════════════════════════════════════════
//  DATA PRO HOME — Interactions JS
//  Odoo 18 · publicWidget pattern
//  Fonctionnalités :
//    - Hero slider 2 slides avec auto-play + dots
//    - Compteurs stats animés (IntersectionObserver)
//    - Reveal scroll animations
//    - Hero tabs actives
//    - Formulaire de contact (envoi JSON-RPC)
// ═══════════════════════════════════════════════════════════

import publicWidget from '@web/legacy/js/public/public_widget';

publicWidget.registry.DataProHome = publicWidget.Widget.extend({
    selector: '.dp-page',

    start() {
        this._initSlider();
        this._initReveal();
        this._initStatsCounter();
        this._initContactForm();
        return this._super(...arguments);
    },

    // ────────────────────────────────────────────────────
    //  SLIDER — 2 slides + dots + barre de progression
    // ────────────────────────────────────────────────────
    _initSlider() {
        const slides = this.el.querySelectorAll('.dp-slide');
        const dots   = this.el.querySelectorAll('.dp-sl-dot');
        const tabs   = this.el.querySelectorAll('.dp-htab');
        const bar    = this.el.querySelector('.dp-sl-bar');
        if (!slides.length) return;

        let current = 0;
        const total = slides.length;
        const DURATION = 5000;

        const goSlide = (n) => {
            slides[current].classList.remove('dp-on');
            dots[current]?.classList.remove('dp-on');
            tabs[current]?.classList.remove('dp-on');

            current = ((n % total) + total) % total;

            slides[current].classList.add('dp-on');
            dots[current]?.classList.add('dp-on');
            tabs[current]?.classList.add('dp-on');

            // Réinitialiser la barre de progression
            if (bar) {
                bar.style.transition = 'none';
                bar.style.width = '0%';
                // Force reflow
                bar.offsetWidth; // eslint-disable-line
                bar.style.transition = `width ${DURATION}ms linear`;
                bar.style.width = '100%';
            }
        };

        const restartAutoplay = () => {
            clearInterval(this._sliderInterval);
            this._sliderInterval = setInterval(() => goSlide(current + 1), DURATION);
        };

        // Attacher les dots (sans onclick inline)
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                goSlide(i);
                restartAutoplay();
            });
        });

        // Attacher les tabs (Odoo ERP / IA & Automation / Dev Sur Mesure)
        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => {
                goSlide(i);
                restartAutoplay();
            });
        });

        // Auto-play
        this._sliderInterval = setInterval(() => goSlide(current + 1), DURATION);

        // Init slide 0
        goSlide(0);
    },

    // ────────────────────────────────────────────────────
    //  REVEAL — animations au scroll
    // ────────────────────────────────────────────────────
    _initReveal() {
        const items = this.el.querySelectorAll('.dp-reveal');
        if (!items.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('dp-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .1 });

        items.forEach(el => observer.observe(el));
    },

    // ────────────────────────────────────────────────────
    //  STATS COUNTER — animation des chiffres
    // ────────────────────────────────────────────────────
    _initStatsCounter() {
        const cards = this.el.querySelectorAll('.dp-stat-card-num[data-target]');
        if (!cards.length) return;

        const animateCount = (el) => {
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 1800;
            const start = performance.now();

            const tick = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Easing easeOutExpo
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const value = Math.round(eased * target);
                el.textContent = value + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .4 });

        cards.forEach(el => observer.observe(el));
    },

    // ────────────────────────────────────────────────────
    //  FORMULAIRE CONTACT — validation + envoi (création crm.lead réelle)
    // ────────────────────────────────────────────────────
    _initContactForm() {
        const btn = this.el.querySelector('[data-action="dp-submit"]');
        if (!btn) return;

        const form = this.el.querySelector('.dp-contact-form');
        if (!form) return;

        const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        const PHONE_RE = /^\+?[0-9][0-9\s.\-]{6,17}[0-9]$/;

        const showError = (field, message) => {
            const input = form.querySelector(`[name="${field}"]`);
            const err   = form.querySelector(`[data-err-for="${field}"]`);
            input?.classList.add('dp-invalid');
            if (err) {
                err.textContent = message;
                err.classList.add('dp-show');
            }
        };

        const clearErrors = () => {
            form.querySelectorAll('.dp-invalid').forEach(el => el.classList.remove('dp-invalid'));
            form.querySelectorAll('.dp-hp-err').forEach(el => {
                el.classList.remove('dp-show');
                el.textContent = '';
            });
        };

        // Nettoyer l'erreur dès que l'utilisateur corrige le champ
        form.querySelectorAll('[data-err-for]').forEach(errEl => {
            const field = errEl.dataset.errFor;
            const input = form.querySelector(`[name="${field}"]`);
            input?.addEventListener('input', () => {
                input.classList.remove('dp-invalid');
                errEl.classList.remove('dp-show');
                errEl.textContent = '';
            });
        });

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            clearErrors();

            const service = form.querySelector('[name="service"]')?.value || '';
            const secteur = form.querySelector('[name="secteur"]')?.value || '';
            const email   = form.querySelector('[name="email"]')?.value.trim() || '';
            const phone   = form.querySelector('[name="phone"]')?.value.trim() || '';

            let valid = true;

            if (!service || service.startsWith('—')) {
                valid = false;
            }
            if (!email) {
                showError('email', 'L\'email est requis.');
                valid = false;
            } else if (!EMAIL_RE.test(email)) {
                showError('email', 'Format d\'email invalide (ex: nom@domaine.com).');
                valid = false;
            }
            if (!phone) {
                showError('phone', 'Le téléphone est requis.');
                valid = false;
            } else if (!PHONE_RE.test(phone)) {
                showError('phone', 'Format de téléphone invalide.');
                valid = false;
            }

            if (!valid) {
                if (!service || service.startsWith('—')) {
                    btn.textContent = '⚠️ Veuillez choisir un service';
                    setTimeout(() => { btn.innerHTML = '🚀 Envoyer ma demande'; }, 2500);
                }
                return;
            }

            btn.innerHTML = '⏳ Envoi en cours…';
            btn.disabled = true;

            try {
                const res = await fetch('/datapro/devis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'call',
                        id: 1,
                        params: { service, secteur, email, phone },
                    }),
                });

                const data = await res.json();
                const result = data.result;

                if (result && result.success) {
                    btn.innerHTML = '✅ Demande envoyée !';
                    form.reset?.();
                } else if (result && result.errors) {
                    Object.entries(result.errors).forEach(([field, msg]) => showError(field, msg));
                    btn.innerHTML = '⚠️ Corrigez les champs en rouge';
                } else {
                    throw new Error(data.error?.message || 'Erreur serveur');
                }
            } catch (err) {
                btn.innerHTML = '❌ Erreur — réessayez';
                console.error('[DataPro] Contact form error:', err);
            } finally {
                setTimeout(() => {
                    btn.innerHTML = '🚀 Envoyer ma demande';
                    btn.disabled = false;
                }, 3500);
            }
        });
    },

    // ────────────────────────────────────────────────────
    //  DESTROY — nettoyage
    // ────────────────────────────────────────────────────
    destroy() {
        if (this._sliderInterval) clearInterval(this._sliderInterval);
        this._super(...arguments);
    },
});

export default publicWidget.registry.DataProHome;
