import { listPublicOrganizations } from '@/lib/public-organizations-server';
import { handleApiError, jsonOk } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return jsonOk({ schools: await listPublicOrganizations('school') });
  } catch (error) {
    return handleApiError(error);
  }
}
