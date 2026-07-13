import { checkDatabase } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await checkDatabase();
    return Response.json({ status: 'ok', service: 'yahnu-web', database: 'reachable', timestamp: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return Response.json({ status: 'unavailable', service: 'yahnu-web' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}
