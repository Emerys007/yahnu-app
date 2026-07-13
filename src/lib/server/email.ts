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
      throw new ApiError(503, 'email_unavailable', 'Email delivery is temporarily unavailable. Please contact support.');
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
    throw new ApiError(503, 'email_unavailable', 'Email delivery is temporarily unavailable. Please try again.');
  }

  return { delivered: true as const };
}

function layout(
  heading: string,
  copy: string,
  buttonText: string,
  url: string,
  footer = 'If you did not request this, you can safely ignore this email.',
) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f8fb;padding:32px;color:#172033"><table role="presentation" style="max-width:560px;margin:auto;background:white;border-radius:16px;padding:32px"><tr><td><div style="font-weight:800;font-size:22px;color:#097969">Yahnu</div><h1 style="font-size:24px">${escapeHtml(heading)}</h1><p style="line-height:1.6">${escapeHtml(copy)}</p><p style="margin:28px 0"><a href="${escapeHtml(url)}" style="background:#097969;color:white;padding:13px 20px;border-radius:9px;text-decoration:none;font-weight:700">${escapeHtml(buttonText)}</a></p><p style="font-size:13px;color:#667085;word-break:break-all">If the button does not work, open:<br>${escapeHtml(url)}</p><p style="font-size:13px;color:#667085">${escapeHtml(footer)}</p></td></tr></table></body></html>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = externalUrl(`/verify-email?token=${encodeURIComponent(token)}`);
  const copy = `Hi ${name}, verify your email address to finish securing your Yahnu account. This link expires in 24 hours.`;
  const delivery = await sendEmail({
    to,
    subject: 'Verify your Yahnu email',
    html: layout('Verify your email', copy, 'Verify email', url),
    text: `${copy}\n\nVerify your email: ${url}`,
  });
  return { ...delivery, debugUrl: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = externalUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  const copy = `Hi ${name}, use this secure link to choose a new Yahnu password. This link expires in one hour and can only be used once.`;
  const delivery = await sendEmail({
    to,
    subject: 'Reset your Yahnu password',
    html: layout('Reset your password', copy, 'Choose a new password', url),
    text: `${copy}\n\nReset your password: ${url}`,
  });
  return { ...delivery, debugUrl: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function sendInvitationEmail(to: string, role: string, token: string) {
  const url = externalUrl(`/register/${encodeURIComponent(token)}`);
  const copy = `You have been invited to join Yahnu as ${role.replaceAll('_', ' ')}. This invitation expires in seven days and can only be used once.`;
  const delivery = await sendEmail({
    to,
    subject: 'You are invited to Yahnu',
    html: layout('Join the Yahnu team', copy, 'Accept invitation', url),
    text: `${copy}\n\nAccept your invitation: ${url}`,
  });
  return { ...delivery, debugUrl: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function sendEmailChangeNotice(to: string, name: string, newEmail: string) {
  const url = externalUrl('/login');
  const copy = `Hi ${name}, your Yahnu sign-in email was changed from ${to} to ${newEmail}. All existing sessions were signed out and any linked Google sign-in was removed as a precaution.`;
  const securityCopy = 'If you did not make this change, contact contact@yahnu.org immediately.';
  return sendEmail({
    to,
    subject: 'Security alert: your Yahnu email changed',
    html: layout('Your email address changed', copy, 'Open Yahnu', url, securityCopy),
    text: `${copy}\n\n${securityCopy}\n\nOpen Yahnu: ${url}`,
  });
}
