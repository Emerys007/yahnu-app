import { getCurrentUser } from '@/lib/server/auth';
import { handleApiError, jsonOk } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return jsonOk({
      user: await getCurrentUser(),
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

