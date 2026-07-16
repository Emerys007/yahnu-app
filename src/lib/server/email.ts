import 'server-only';

import { ApiError } from '@/lib/server/http';

type EmailMessage = { to: string; subject: string; html: string; text: string };

function appUrl() {
  const value = process.env.APP_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  if (!value) throw new Error('APP_URL is required in production.');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('APP_URL must be a valid absolute URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) {
    throw new Error('APP_URL must use HTTPS in production.');
  }
  return parsed.origin;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}

export function externalUrl(path: string) {
  return `${appUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function sendEmail(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(503, 'email_unavailable', 'L’envoi d’e-mail est momentanément indisponible. Contactez le support Yahnu.');
    }
    return { delivered: false as const };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...message }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    console.error('Email provider rejected a message:', response.status);
    throw new ApiError(503, 'email_unavailable', 'L’envoi d’e-mail est momentanément indisponible. Réessayez dans un instant.');
  }

  return { delivered: true as const };
}

function layout(
  heading: string,
  copy: string,
  buttonText: string,
  url: string,
  footer = 'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.',
) {
  return `<!doctype html><html lang="fr"><body style="font-family:Arial,sans-serif;background:#fbf7ec;padding:32px;color:#123c31"><table role="presentation" style="max-width:560px;margin:auto;background:white;border:1px solid #d9e4df;border-radius:22px;padding:32px"><tr><td><div style="font-weight:800;font-size:24px;color:#126b49">Yahnu <span style="font-size:12px;color:#ef7d24;letter-spacing:.08em;text-transform:uppercase">Côte d’Ivoire</span></div><h1 style="font-size:26px;line-height:1.15;color:#123c31">${escapeHtml(heading)}</h1><p style="line-height:1.7;color:#4e625c">${escapeHtml(copy)}</p><p style="margin:30px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#126b49;color:white;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:700">${escapeHtml(buttonText)}</a></p><p style="font-size:13px;line-height:1.6;color:#667a73;word-break:break-all">Si le bouton ne fonctionne pas, ouvrez ce lien :<br>${escapeHtml(url)}</p><p style="font-size:13px;line-height:1.6;color:#667a73">${escapeHtml(footer)}</p></td></tr></table></body></html>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = externalUrl(`/verify-email?token=${encodeURIComponent(token)}`);
  const copy = `Bonjour ${name}, confirmez votre adresse e-mail pour sécuriser votre compte Yahnu. Ce lien expire dans 24 heures.`;
  const delivery = await sendEmail({
    to,
    subject: 'Confirmez votre adresse e-mail Yahnu',
    html: layout('Confirmez votre adresse e-mail', copy, 'Confirmer mon adresse', url),
    text: `${copy}\n\nConfirmer mon adresse : ${url}`,
  });
  return { ...delivery, debugUrl: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = externalUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  const copy = `Bonjour ${name}, utilisez ce lien sécurisé pour choisir un nouveau mot de passe Yahnu. Il expire dans une heure et ne peut servir qu’une fois.`;
  const delivery = await sendEmail({
    to,
    subject: 'Réinitialisez votre mot de passe Yahnu',
    html: layout('Choisissez un nouveau mot de passe', copy, 'Créer mon mot de passe', url),
    text: `${copy}\n\nRéinitialiser mon mot de passe : ${url}`,
  });
  return { ...delivery, debugUrl: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function sendInvitationEmail(to: string, role: string, token: string) {
  const url = externalUrl(`/register/${encodeURIComponent(token)}`);
  const roles: Record<string, string> = { admin: 'administrateur', super_admin: 'super-administrateur', content_manager: 'responsable éditorial', content_moderator: 'modérateur de contenu', support_staff: 'membre du support' };
  const roleLabel = roles[role] ?? role.replaceAll('_', ' ');
  const copy = `Vous êtes invité·e à rejoindre l’équipe Yahnu comme ${roleLabel}. Cette invitation expire dans sept jours et ne peut servir qu’une fois.`;
  const delivery = await sendEmail({
    to,
    subject: 'Votre invitation à rejoindre Yahnu',
    html: layout('Rejoignez l’équipe Yahnu', copy, 'Accepter l’invitation', url),
    text: `${copy}\n\nAccepter l’invitation : ${url}`,
  });
  return { ...delivery, debugUrl: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function sendEmailChangeNotice(to: string, name: string, newEmail: string) {
  const url = externalUrl('/login');
  const copy = `Bonjour ${name}, l’adresse de connexion à votre compte Yahnu a été modifiée : ${to} devient ${newEmail}. Toutes les sessions actives ont été fermées et la connexion Google associée a été retirée par précaution.`;
  const securityCopy = 'Si vous n’êtes pas à l’origine de ce changement, écrivez immédiatement à contact@yahnu.org.';
  return sendEmail({
    to,
    subject: 'Alerte de sécurité : votre adresse Yahnu a changé',
    html: layout('Votre adresse e-mail a changé', copy, 'Ouvrir Yahnu', url, securityCopy),
    text: `${copy}\n\n${securityCopy}\n\nOuvrir Yahnu : ${url}`,
  });
}
