import { listPublicOrganizations } from '@/lib/public-organizations-server';
import { handleApiError, jsonOk } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return jsonOk({ companies: await listPublicOrganizations('company') });
  } catch (error) {
    return handleApiError(error);
  }
}
