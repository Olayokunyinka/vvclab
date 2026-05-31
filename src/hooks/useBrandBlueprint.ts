import { useEffect, useState } from "react";
import {
  BLUEPRINT_KEY,
  getBlueprint,
  hydrateBlueprintFromServer,
  type BrandBlueprint,
} from "@/lib/brandBlueprint";
import { useAuth } from "@/components/AuthProvider";

export function useBrandBlueprint() {
  const [blueprint, setBlueprint] = useState<BrandBlueprint | null>(null);
  const [ready, setReady] = useState(false);
  const { userId } = useAuth();

  useEffect(() => {
    let cancelled = false;

    // Fast path: localStorage cache.
    const cached = getBlueprint();
    if (cached) {
      setBlueprint(cached);
      setReady(true);
    }

    // If we don't have a cached blueprint but the user is signed in, hydrate
    // from Supabase (source of truth).
    if (!cached && userId) {
      hydrateBlueprintFromServer().then((bp) => {
        if (cancelled) return;
        setBlueprint(bp);
        setReady(true);
      });
    } else if (!cached) {
      setReady(true);
    }

    const refresh = () => {
      if (!cancelled) setBlueprint(getBlueprint());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLUEPRINT_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("brandBlueprint:changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("brandBlueprint:changed", refresh);
    };
  }, [userId]);

  return { blueprint, ready };
}
