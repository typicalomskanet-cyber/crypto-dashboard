import { useCallback } from "react";
import { useLocalState } from "./storage";

const RECENT_KEY = "yantach.recentlyViewed.v1";
const COMPARE_KEY = "yantach.compare.v1";
const RECENT_LIMIT = 10;
const COMPARE_LIMIT = 4;

/** Last-N viewed products, MRU-ordered (newest first). */
export function useRecentlyViewed() {
  const [ids, setIds] = useLocalState<string[]>(RECENT_KEY, []);

  const track = useCallback(
    (productId: string) => {
      setIds(prev => {
        const next = [productId, ...prev.filter(x => x !== productId)];
        return next.slice(0, RECENT_LIMIT);
      });
    },
    [setIds],
  );

  const clear = useCallback(() => setIds([]), [setIds]);

  return { ids, track, clear };
}

/** Side-by-side compare list. */
export function useCompare() {
  const [ids, setIds] = useLocalState<string[]>(COMPARE_KEY, []);

  const toggle = useCallback(
    (productId: string) => {
      setIds(prev => {
        if (prev.includes(productId)) return prev.filter(x => x !== productId);
        if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), productId];
        return [...prev, productId];
      });
    },
    [setIds],
  );

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);
  const remove = useCallback(
    (productId: string) => setIds(prev => prev.filter(x => x !== productId)),
    [setIds],
  );
  const clear = useCallback(() => setIds([]), [setIds]);

  return { ids, toggle, has, remove, clear, limit: COMPARE_LIMIT };
}
