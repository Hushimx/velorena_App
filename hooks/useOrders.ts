import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrders, OrdersIndexParams } from '../utils/api';

export function useOrders(initial: OrdersIndexParams = {}) {
  const [params, setParams] = useState<OrdersIndexParams>({ per_page: 15, sort_by: 'created_at', sort_order: 'desc', ...initial });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const parse = (res: any) => {
    const payload = res?.data ?? res;
    const list = payload?.data ?? payload?.orders ?? [];
    const meta = payload?.meta ?? {};
    return { list: Array.isArray(list) ? list : [], meta };
  };

  const reload = useCallback(async (next?: Partial<OrdersIndexParams>) => {
    setLoading(true); setError(null);
    try {
      let req = { ...params, ...(next ?? {}), page: 1 };
      
      // Handle special filter for cancelled + deleted orders
      if (req.status === 'cancelled_or_deleted') {
        // Remove the special status and we'll filter on the client side
        delete req.status;
        const res = await getOrders(req);
        const { list, meta } = parse(res);
        // Filter to show only cancelled or deleted orders
        const filteredList = list.filter((order: any) => 
          order.status === 'cancelled' || order.status === 'deleted'
        );
        setOrders(filteredList);
        setPage(meta.page ?? meta.current_page ?? 1);
        setPages(meta.pages ?? meta.last_page ?? 1);
        setParams(req);
      } else {
        const res = await getOrders(req);
        const { list, meta } = parse(res);
        setOrders(list);
        setPage(meta.page ?? meta.current_page ?? 1);
        setPages(meta.pages ?? meta.last_page ?? 1);
        setParams(req);
      }
    } catch (e: any) { setError(e?.message || 'Failed to load orders'); }
    finally { setLoading(false); }
  }, [params]);

  const loadMore = useCallback(async () => {
    if (loading || page >= pages) return;
    setLoading(true); setError(null);
    try {
      const nextPage = (params.page ?? page) + 1;
      let req = { ...params, page: nextPage };
      
      // Handle special filter for cancelled + deleted orders
      if (req.status === 'cancelled_or_deleted') {
        delete req.status;
        const res = await getOrders(req);
        const { list, meta } = parse(res);
        // Filter to show only cancelled or deleted orders
        const filteredList = list.filter((order: any) => 
          order.status === 'cancelled' || order.status === 'deleted'
        );
        setOrders((prev) => prev.concat(filteredList));
        setPage(meta.page ?? meta.current_page ?? nextPage);
        setPages(meta.pages ?? meta.last_page ?? pages);
        setParams((p) => ({ ...p, page: nextPage }));
      } else {
        const res = await getOrders(req);
        const { list, meta } = parse(res);
        setOrders((prev) => prev.concat(list));
        setPage(meta.page ?? meta.current_page ?? nextPage);
        setPages(meta.pages ?? meta.last_page ?? pages);
        setParams((p) => ({ ...p, page: nextPage }));
      }
    } catch (e: any) { setError(e?.message || 'Failed to load more'); }
    finally { setLoading(false); }
  }, [loading, page, pages, params]);

  useEffect(() => { reload(); }, []);
  const hasMore = useMemo(() => page < pages, [page, pages]);

  return { orders, loading, error, params, setFilter: (p: Partial<OrdersIndexParams>) => reload(p), loadMore, hasMore, reload };
}
