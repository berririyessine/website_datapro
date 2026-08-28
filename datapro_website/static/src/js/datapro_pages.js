/** @odoo-module **/
// ═══════════════════════════════════════════════════════════
//  DATA PRO PAGES — Interactions JS pages secondaires
//  Odoo 18 · publicWidget pattern
//  Fonctionnalités :
//    - Filtre services (page /services)
//    - Filtre projets (page /projets-clients)
//    - Scroll reveal (toutes pages)
//    - Formulaire contact enrichi (page /contact)
//    - Header sticky actif selon scroll
// ═══════════════════════════════════════════════════════════

import publicWidget from '@web/legacy/js/public/public_widget';

// ────────────────────────────────────────────────────────────
//  WIDGET COMMUN — actif sur TOUTES les sous-pages
// ────────────────────────────────────────────────────────────
publicWidget.registry.DataProPages = publicWidget.Widget.extend({
    selector: '.dp-page',

    start() {
        this._hideStandardChrome();
        this._initReveal();
        this._initHeaderScroll();
        this._initTopbarCta();
        this._initFloatBar();
        return this._super(...arguments);
    },

    // ── Masquer header + footer standard Odoo (website.layout) ──
    //    On garde uniquement le header/footer custom Data Pro
    _hideStandardChrome() {
        const stdHeader = document.querySelector('#wrapwrap > header');
        if (stdHeader) stdHeader.classList.add('d-none');

        const stdFooter = document.querySelector('#wrapwrap > footer');
        if (stdFooter) stdFooter.classList.add('d-none');
    },

    // ── Barre flottante WhatsApp / Devis gratuit ────────────
    //    Visible dès le chargement, reste fixe pendant le scroll
    _initFloatBar() {
        const bar = this.el.querySelector('.dp-float-bar');
        if (!bar) return;

        const onScroll = () => {
            bar.classList.toggle('dp-float-bar-compact', window.scrollY > 300);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        this._floatBarScrollHandler = onScroll;
    },

    // ── Scroll Reveal ──────────────────────────────────────
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
        }, { threshold: .08 });

        items.forEach(el => observer.observe(el));
    },

    // ── Header scroll shadow ────────────────────────────────
    _initHeaderScroll() {
        const header = this.el.querySelector('.dp-header');
        if (!header) return;

        const onScroll = () => {
            header.classList.toggle('dp-header-scrolled', window.scrollY > 20);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        this._headerScrollHandler = onScroll;
    },

    // ── Topbar CTA ─────────────────────────────────────────
    _initTopbarCta() {
        const btns = this.el.querySelectorAll('.dp-tb-cta');
        btns.forEach(btn => {
            if (!btn.getAttribute('onclick')) {
                btn.addEventListener('click', () => {
                    window.location.href = '/contact';
                });
            }
        });
    },

    destroy() {
        if (this._headerScrollHandler) {
            window.removeEventListener('scroll', this._headerScrollHandler);
        }
        if (this._floatBarScrollHandler) {
            window.removeEventListener('scroll', this._floatBarScrollHandler);
        }
        this._super(...arguments);
    },
});

// ────────────────────────────────────────────────────────────
//  WIDGET SERVICES — filtre par catégorie
// ────────────────────────────────────────────────────────────
publicWidget.registry.DataProServices = publicWidget.Widget.extend({
    selector: '.dp-page',

    start() {
        this._initServiceFilter();
        return this._super(...arguments);
    },

    _initServiceFilter() {
        const tabs  = this.el.querySelectorAll('.svc-ftab');
        const cards = this.el.querySelectorAll('.svc-big-card[data-cat]');
        if (!tabs.length || !cards.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter || 'all';

                // Mettre à jour les tabs
                tabs.forEach(t => t.classList.remove('svc-on'));
                tab.classList.add('svc-on');

                // Filtrer les cartes
                cards.forEach(card => {
                    const cats = (card.dataset.cat || '').split(' ');
                    const visible = filter === 'all' || cats.includes(filter);
                    card.style.display = visible ? '' : 'none';
                    if (visible) {
                        card.style.animation = 'fadeInUp .3s ease';
                    }
                });
            });
        });
    },
});

// ────────────────────────────────────────────────────────────
//  WIDGET PROJETS — filtre par catégorie
// ────────────────────────────────────────────────────────────
publicWidget.registry.DataProProjets = publicWidget.Widget.extend({
    selector: '.dp-page',

    start() {
        this._initProjetFilter();
        return this._super(...arguments);
    },

    _initProjetFilter() {
        const tabs  = this.el.querySelectorAll('.proj-ftab');
        const cards = this.el.querySelectorAll('.proj-card[data-pcat]');
        if (!tabs.length || !cards.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.pfilter || 'all';

                tabs.forEach(t => t.classList.remove('proj-on'));
                tab.classList.add('proj-on');

                cards.forEach(card => {
                    const cats = (card.dataset.pcat || '').split(' ');
                    const visible = filter === 'all' || cats.includes(filter);
                    card.style.display = visible ? '' : 'none';
                });
            });
        });
    },
});

// ────────────────────────────────────────────────────────────
//  WIDGET CONTACT — formulaire enrichi (page /contact)
// ────────────────────────────────────────────────────────────
publicWidget.registry.DataProContact = publicWidget.Widget.extend({
    selector: '.dp-page',

    start() {
        this._initContactFormFull();
        return this._super(...arguments);
    },

    _initContactFormFull() {
        const btn = this.el.querySelector('.ct-submit-btn[data-action="dp-submit"]');
        if (!btn) return;

        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            const form = this.el.querySelector('.ct-form');
            if (!form) return;

            // Récupérer les valeurs
            const name        = form.querySelector('[name="name"]')?.value?.trim() || '';
            const email       = form.querySelector('[name="email"]')?.value?.trim() || '';
            const service     = form.querySelector('[name="service"]')?.value || '';
            const company     = form.querySelector('[name="company"]')?.value?.trim() || '';
            const phone       = form.querySelector('[name="phone"]')?.value?.trim() || '';
            const secteur     = form.querySelector('[name="secteur"]')?.value || '';
            const budget      = form.querySelector('[name="budget"]')?.value || '';
            const description = form.querySelector('[name="description"]')?.value?.trim() || '';

            // Validation
            if (!name || !email || !service || !description) {
                btn.textContent = '⚠️ Veuillez remplir les champs obligatoires';
                btn.style.background = 'var(--dp-warn)';
                setTimeout(() => {
                    btn.textContent = '🚀 Envoyer ma demande';
                    btn.style.background = '';
                }, 3000);
                return;
            }

            btn.innerHTML = '⏳ Envoi en cours…';
            btn.disabled = true;

            // Construction du lead Odoo
            const leadName = `[DataPro Site] ${service} — ${name}${company ? ' · ' + company : ''}`;
            const leadDesc = [
                `Nom : ${name}`,
                company     ? `Société : ${company}` : '',
                `Email : ${email}`,
                phone       ? `Téléphone : ${phone}` : '',
                `Service : ${service}`,
                secteur     ? `Secteur : ${secteur}` : '',
                budget      ? `Budget : ${budget}` : '',
                '',
                `Description :\n${description}`,
            ].filter(Boolean).join('\n');

            try {
                const res = await fetch('/web/dataset/call_kw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'call',
                        id: Date.now(),
                        params: {
                            model: 'crm.lead',
                            method: 'create',
                            args: [{
                                name: leadName,
                                description: leadDesc,
                                contact_name: name,
                                email_from: email,
                                phone: phone,
                                partner_name: company,
                                tag_ids: [],
                            }],
                            kwargs: {},
                        },
                    }),
                });

                const data = await res.json();

                if (data.result) {
                    btn.innerHTML = '✅ Demande envoyée — nous vous contactons sous 24h !';
                    btn.style.background = 'var(--dp-success)';
                    // Reset form
                    form.querySelectorAll('input[type="text"], input[type="email"], textarea, select').forEach(el => {
                        el.value = '';
                    });
                } else {
                    throw new Error(data.error?.message || 'Erreur serveur');
                }
            } catch (err) {
                btn.innerHTML = '❌ Erreur réseau — contactez-nous par WhatsApp';
                btn.style.background = '#DC2626';
                console.error('[DataPro Contact] Error:', err);
            } finally {
                setTimeout(() => {
                    btn.innerHTML = '🚀 Envoyer ma demande';
                    btn.style.background = '';
                    btn.disabled = false;
                }, 5000);
            }
        });
    },
});

// ────────────────────────────────────────────────────────────
//  WIDGET RECRUTEMENT — formulaire de candidature (page /recrutement)
// ────────────────────────────────────────────────────────────
publicWidget.registry.DataProRecruitment = publicWidget.Widget.extend({
    selector: '.dp-page',

    start() {
        this._initJobApplyButtons();
        this._initRecruitForm();
        return this._super(...arguments);
    },

    // Pré-remplit le select "Poste souhaité" et scroll vers le formulaire
    _initJobApplyButtons() {
        const buttons = this.el.querySelectorAll('.rec-job-apply');
        if (!buttons.length) return;

        const select = this.el.querySelector('.dp-recruit-form [name="poste"]');
        const formSection = this.el.querySelector('.rec-form-section');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const poste = btn.dataset.poste;
                if (select && poste) {
                    select.value = poste;
                }
                formSection?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    },

    _initRecruitForm() {
        const btn = this.el.querySelector('[data-action="dp-recruit-submit"]');
        if (!btn) return;

        const form = this.el.querySelector('.dp-recruit-form');
        if (!form) return;

        const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        const PHONE_RE = /^\+?[0-9][0-9\s.\-]{6,17}[0-9]$/;

        const showError = (field, message) => {
            const input = form.querySelector(`[name="${field}"]`);
            const err = form.querySelector(`[data-err-for="${field}"]`);
            input?.classList.add('dp-invalid');
            if (err) {
                err.textContent = message;
                err.classList.add('dp-show');
            }
        };

        const clearErrors = () => {
            form.querySelectorAll('.dp-invalid').forEach(el => el.classList.remove('dp-invalid'));
            form.querySelectorAll('.ct-err').forEach(el => {
                el.classList.remove('dp-show');
                el.textContent = '';
            });
        };

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

            const full_name = form.querySelector('[name="full_name"]')?.value?.trim() || '';
            const email     = form.querySelector('[name="email"]')?.value?.trim() || '';
            const phone     = form.querySelector('[name="phone"]')?.value?.trim() || '';
            const poste     = form.querySelector('[name="poste"]')?.value || '';
            const cv_link   = form.querySelector('[name="cv_link"]')?.value?.trim() || '';
            const message   = form.querySelector('[name="message"]')?.value?.trim() || '';
            const cvInput   = form.querySelector('[name="cv_file"]');
            const cvFile    = cvInput?.files?.[0] || null;

            const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
            const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

            let valid = true;

            if (!full_name) {
                showError('full_name', 'Le nom complet est requis.');
                valid = false;
            }
            if (!email) {
                showError('email', "L'email est requis.");
                valid = false;
            } else if (!EMAIL_RE.test(email)) {
                showError('email', "Format d'email invalide.");
                valid = false;
            }
            if (phone && !PHONE_RE.test(phone)) {
                showError('phone', 'Format de téléphone invalide.');
                valid = false;
            }
            if (!poste) {
                showError('poste', 'Veuillez choisir un poste.');
                valid = false;
            }
            if (!cvFile) {
                showError('cv_file', 'Le CV est obligatoire.');
                valid = false;
            } else {
                const ext = cvFile.name.split('.').pop().toLowerCase();
                if (!ALLOWED_EXT.includes(ext)) {
                    showError('cv_file', 'Formats acceptés : PDF, DOC, DOCX.');
                    valid = false;
                } else if (cvFile.size > MAX_SIZE) {
                    showError('cv_file', 'Le fichier ne doit pas dépasser 5 Mo.');
                    valid = false;
                }
            }

            if (!valid) return;

            btn.innerHTML = '⏳ Envoi en cours…';
            btn.disabled = true;

            try {
                const cv_filename = cvFile.name;
                const cv_base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1] || '');
                    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
                    reader.readAsDataURL(cvFile);
                });

                const res = await fetch('/datapro/candidature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'call',
                        id: Date.now(),
                        params: { full_name, email, phone, poste, cv_link, message, cv_filename, cv_base64 },
                    }),
                });

                const data = await res.json();
                const result = data.result;

                if (result && result.success) {
                    btn.innerHTML = '✅ Candidature envoyée !';
                    form.reset?.();
                } else if (result && result.errors) {
                    Object.entries(result.errors).forEach(([field, msg]) => showError(field, msg));
                    btn.innerHTML = '⚠️ Corrigez les champs en rouge';
                } else {
                    throw new Error(data.error?.message || 'Erreur serveur');
                }
            } catch (err) {
                btn.innerHTML = '❌ Erreur — réessayez ou contactez-nous';
                console.error('[DataPro Recrutement] Error:', err);
            } finally {
                setTimeout(() => {
                    btn.innerHTML = '📤 Envoyer ma candidature';
                    btn.disabled = false;
                }, 3500);
            }
        });
    },
});

export default {
    DataProPages: publicWidget.registry.DataProPages,
    DataProServices: publicWidget.registry.DataProServices,
    DataProProjets: publicWidget.registry.DataProProjets,
    DataProContact: publicWidget.registry.DataProContact,
    DataProRecruitment: publicWidget.registry.DataProRecruitment,
};
