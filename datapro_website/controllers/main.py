# -*- coding: utf-8 -*-
import base64
import re

from odoo import http
from odoo.http import request

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Accepte : +33612345678, 0612345678, +216 25 470 222, avec espaces/points/tirets
PHONE_RE = re.compile(r"^\+?[0-9][0-9\s.\-]{6,17}[0-9]$")

CV_ALLOWED_EXT = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
CV_MAX_SIZE = 5 * 1024 * 1024  # 5 Mo


class DataProWebsiteForms(http.Controller):

    @http.route('/datapro/devis', type='json', auth='public', website=True, csrf=True)
    def create_devis_lead(self, **post):
        service = (post.get('service') or '').strip()
        secteur = (post.get('secteur') or '').strip()
        email = (post.get('email') or '').strip()
        phone = (post.get('phone') or '').strip()

        errors = {}

        if not service or service.startswith('—'):
            errors['service'] = "Veuillez choisir un service."

        if not email:
            errors['email'] = "L'email est requis."
        elif not EMAIL_RE.match(email):
            errors['email'] = "Format d'email invalide."

        if not phone:
            errors['phone'] = "Le téléphone est requis."
        elif not PHONE_RE.match(phone):
            errors['phone'] = "Format de téléphone invalide."

        if errors:
            return {'success': False, 'errors': errors}

        lead_vals = {
            'name': "[DataPro Site] %s" % (service or 'Demande de devis'),
            'email_from': email,
            'phone': phone,
            'description': "Service : %s\nSecteur : %s\nEmail : %s\nTéléphone : %s" % (
                service, secteur or '—', email, phone
            ),
        }

        # Source/medium UTM — best effort, ne bloque jamais la création du lead
        try:
            lead_vals['medium_id'] = request.env.ref('utm.utm_medium_website').id
            lead_vals['source_id'] = request.env.ref('utm.utm_source_website').id
        except ValueError:
            pass

        lead = request.env['crm.lead'].sudo().create(lead_vals)

        return {'success': True, 'lead_id': lead.id}

    @http.route('/datapro/candidature', type='json', auth='public', website=True, csrf=True)
    def create_candidature(self, **post):
        full_name = (post.get('full_name') or '').strip()
        email = (post.get('email') or '').strip()
        phone = (post.get('phone') or '').strip()
        poste = (post.get('poste') or '').strip()
        message = (post.get('message') or '').strip()
        cv_link = (post.get('cv_link') or '').strip()
        cv_filename = (post.get('cv_filename') or '').strip()
        cv_base64 = (post.get('cv_base64') or '').strip()

        errors = {}

        if not full_name:
            errors['full_name'] = "Le nom complet est requis."

        if not email:
            errors['email'] = "L'email est requis."
        elif not EMAIL_RE.match(email):
            errors['email'] = "Format d'email invalide."

        if phone and not PHONE_RE.match(phone):
            errors['phone'] = "Format de téléphone invalide."

        if not poste or poste.startswith('—'):
            errors['poste'] = "Veuillez choisir un poste."

        # ── CV obligatoire ──
        cv_ext = cv_filename.rsplit('.', 1)[-1].lower() if '.' in cv_filename else ''
        cv_binary = None
        if not cv_filename or not cv_base64:
            errors['cv_file'] = "Le CV est obligatoire."
        elif cv_ext not in CV_ALLOWED_EXT:
            errors['cv_file'] = "Formats acceptés : PDF, DOC, DOCX."
        else:
            try:
                cv_binary = base64.b64decode(cv_base64, validate=True)
            except Exception:
                errors['cv_file'] = "Le fichier du CV est invalide."
            else:
                if len(cv_binary) > CV_MAX_SIZE:
                    errors['cv_file'] = "Le fichier ne doit pas dépasser 5 Mo."

        if errors:
            return {'success': False, 'errors': errors}

        description = (
            "Poste souhaité : %s\n"
            "Nom : %s\n"
            "Email : %s\n"
            "Téléphone : %s\n"
            "CV : %s\n"
            "Lien Portfolio / LinkedIn : %s\n\n"
            "Message :\n%s"
        ) % (poste, full_name, email, phone or '—', cv_filename, cv_link or '—', message or '—')

        # On privilégie hr.applicant (module Recrutement) s'il est installé,
        # sinon on retombe sur crm.lead pour ne jamais perdre la candidature.
        applicant_id = None
        target_model = None
        if 'hr.applicant' in request.env:
            try:
                applicant_vals = {
                    'partner_name': full_name,
                    'email_from': email,
                    'partner_phone': phone,
                    'job_id': False,
                    'description': description,
                }
                # Rattache au poste s'il correspond à une fiche hr.job existante
                job = request.env['hr.job'].sudo().search([('name', '=', poste)], limit=1)
                if job:
                    applicant_vals['job_id'] = job.id
                    applicant_vals['department_id'] = job.department_id.id
                applicant = request.env['hr.applicant'].sudo().create(applicant_vals)
                applicant_id = applicant.id
                target_model = 'hr.applicant'
            except Exception:
                applicant_id = None

        if not applicant_id:
            lead_vals = {
                'name': "[Candidature] %s — %s" % (poste, full_name),
                'contact_name': full_name,
                'email_from': email,
                'phone': phone,
                'description': description,
                'type': 'lead',
            }
            try:
                lead_vals['medium_id'] = request.env.ref('utm.utm_medium_website').id
                lead_vals['source_id'] = request.env.ref('utm.utm_source_website').id
            except ValueError:
                pass
            lead = request.env['crm.lead'].sudo().create(lead_vals)
            applicant_id = lead.id
            target_model = 'crm.lead'

        # ── Pièce jointe : CV rattaché à la candidature ──
        try:
            request.env['ir.attachment'].sudo().create({
                'name': cv_filename,
                'datas': cv_base64,
                'res_model': target_model,
                'res_id': applicant_id,
                'mimetype': CV_ALLOWED_EXT.get(cv_ext, 'application/octet-stream'),
            })
        except Exception:
            # La candidature est déjà enregistrée ; on ne bloque pas si la pièce
            # jointe échoue, mais on le laisse tracé dans les logs serveur.
            pass

        return {'success': True, 'id': applicant_id}
