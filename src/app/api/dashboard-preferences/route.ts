import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const layoutItemSchema = z.object({
  i: z.string().trim().min(1).max(100),
  x: z.number().int().min(0).max(10_000),
  y: z.number().int().min(0).max(100_000),
  w: z.number().int().min(1).max(100),
  h: z.number().int().min(1).max(100),
}).strict();

const layoutsSchema = z.record(z.array(layoutItemSchema).max(100))
  .refine((layouts) => Object.keys(layouts).length <= 5, 'Too many responsive layouts.');
const reportSchema = z.object({
  dataSource: z.enum(['graduates', 'companies', 'applications']),
  visualization: z.enum(['bar', 'pie', 'count']),
  title: z.string().trim().min(1).max(160),
}).strict();
const reportsSchema = z.record(reportSchema)
  .refine((reports) => Object.keys(reports).length <= 100, 'Too many dashboard reports.');
const updateSchema = z.object({ layouts: layoutsSchema, reports: reportsSchema }).strict();

type DashboardPreferencesRow = {
  layouts: Record<string, unknown>;
  reports: Record<string, unknown>;
  updated_at: Date | string;
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const result = await query<DashboardPreferencesRow>(`
      SELECT layouts, reports, updated_at
      FROM dashboard_preferences
      WHERE user_id = $1
    `, [user.uid]);
    const preferences = result.rows[0];

    return jsonOk({
      preferences: preferences ? {
        layouts: preferences.layouts,
        reports: preferences.reports,
        updatedAt: new Date(preferences.updated_at).toISOString(),
      } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = updateSchema.parse(await readJson(request));

    const result = await query<DashboardPreferencesRow>(`
      INSERT INTO dashboard_preferences (user_id, layouts, reports)
      VALUES ($1, $2::jsonb, $3::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET
        layouts = EXCLUDED.layouts,
        reports = EXCLUDED.reports
      RETURNING layouts, reports, updated_at
    `, [user.uid, JSON.stringify(input.layouts), JSON.stringify(input.reports)]);
    const preferences = result.rows[0];

    return jsonOk({
      preferences: {
        layouts: preferences.layouts,
        reports: preferences.reports,
        updatedAt: new Date(preferences.updated_at).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
