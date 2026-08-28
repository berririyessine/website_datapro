# -*- coding: utf-8 -*-
{
    'name': 'Data Pro Technologie — Site Web',
    'summary': 'Site vitrine DataPro.tn — Design system Bento nearshore v3',
    'description': """
        Module website officiel Data Pro Technologie.
        Pages :
          - Accueil          : /datapro-home
          - Services         : /services
          - Odoo Consultant  : /odoo-consultant
          - IA & Automation  : /ia-automation
          - Développement    : /developpement
          - Sites Web        : /sites-web
          - Projets Clients  : /projets-clients
          - Contact          : /contact
          - Recrutement      : /recrutement
          - À propos         : /a-propos
          - Nearshore (hors menu) : /nearshore-tunisie
        Design : Dark Bento Grid, palette Teal/Violet/Navy
        Auteur : Data Pro Technologie — datapro.tn
    """,
    'category': 'Website',
    'version': '18.0.2.0.0',
    'author': 'Data Pro Technologie',
    'website': 'https://datapro.tn',
    'depends': ['website'],
    'data': [
        'views/templates.xml',
        'views/odoo_consultant.xml',
        'views/page_services.xml',
        'views/page_ia_automation.xml',
        'views/page_developpement.xml',
        'views/page_sites_web.xml',
        'views/page_projets_clients.xml',
        'views/page_contact.xml',
        'views/page_recrutement.xml',
        'views/page_nearshore.xml',
        'views/page_apropos.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'datapro_website/static/src/scss/variables.scss',
            'datapro_website/static/src/scss/layout.scss',
            'datapro_website/static/src/scss/hero.scss',
            'datapro_website/static/src/scss/sections.scss',
            'datapro_website/static/src/scss/odoo_consultant.scss',
            'datapro_website/static/src/scss/pages.scss',
            'datapro_website/static/src/js/datapro_home.js',
            'datapro_website/static/src/js/datapro_pages.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
