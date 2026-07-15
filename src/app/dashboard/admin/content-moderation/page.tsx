"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, RefreshCw } from "lucide-react";

import { ContentModerationClient } from "./content-moderation-client";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export type ModerationItem = {
  id: string;
  name: string;
  email: string;
  type: 'company' | 'school';
  submittedAt: string;
  details: Record<string, unknown>;
};

type ModerationResponse = { data: { items: ModerationItem[] } };

export default function ContentModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<ModerationResponse>('/api/content/moderation');
      setItems(response.data.items);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la file de modération.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3"><Eye className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modération de contenu</h1>
            <p className="mt-1 text-muted-foreground">Examinez les nouveaux profils d'entreprises et d'écoles avant leur publication.</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualiser
        </Button>
      </div>
      {error ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
      {loading && items.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <ContentModerationClient key={items.map((item) => item.id).join(':')} initialItems={items} />
      )}
    </div>
  );
}
