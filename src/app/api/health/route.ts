import { checkDatabase } from '@/lib/server/db';
import { isEmailDeliveryConfigured } from '@/lib/server/email-config.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const emailReady = isEmailDeliveryConfigured();
  try {
    await checkDatabase();
    return Response.json({
      status: emailReady ? 'ok' : 'unavailable',
      service: 'yahnu-web',
      database: 'reachable',
      emailReady,
      timestamp: new Date().toISOString(),
    }, {
      status: emailReady ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return Response.json({ status: 'unavailable', service: 'yahnu-web', emailReady }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}
