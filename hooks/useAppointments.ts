import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appointment, AppointmentsIndexParams, getAppointments } from '../utils/api';

export function useAppointments(initial: AppointmentsIndexParams = {}) {
  const [params, setParams] = useState<AppointmentsIndexParams>({ 
    per_page: 15, 
    sort_by: 'appointment_date', 
    sort_order: 'desc', 
    ...initial 
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const parse = (res: any) => {
    const payload = res?.data ?? res;
    const list = payload?.data ?? payload?.appointments ?? [];
    const meta = payload?.meta ?? {};
    return { list: Array.isArray(list) ? list : [], meta };
  };

  const reload = useCallback(async (next?: Partial<AppointmentsIndexParams>) => {
    setLoading(true); 
    setError(null);
    try {
      const req = { ...params, ...(next ?? {}), page: 1 };
      const res = await getAppointments(req);
      const { list, meta } = parse(res);
      setAppointments(list);
      setPage(meta.page ?? meta.current_page ?? 1);
      setPages(meta.pages ?? meta.last_page ?? 1);
      setParams(req);
    } catch (e: any) { 
      setError(e?.message || 'Failed to load appointments'); 
    } finally { 
      setLoading(false); 
    }
  }, [params]);

  const loadMore = useCallback(async () => {
    if (loading || page >= pages) return;
    setLoading(true); 
    setError(null);
    try {
      const nextPage = (params.page ?? page) + 1;
      const req = { ...params, page: nextPage };
      const res = await getAppointments(req);
      const { list, meta } = parse(res);
      setAppointments((prev) => prev.concat(list));
      setPage(meta.page ?? meta.current_page ?? nextPage);
      setPages(meta.pages ?? meta.last_page ?? pages);
      setParams((p) => ({ ...p, page: nextPage }));
    } catch (e: any) { 
      setError(e?.message || 'Failed to load more'); 
    } finally { 
      setLoading(false); 
    }
  }, [loading, page, pages, params]);

  useEffect(() => { reload(); }, []);
  const hasMore = useMemo(() => page < pages, [page, pages]);

  return { 
    appointments, 
    loading, 
    error, 
    params, 
    setFilter: (p: Partial<AppointmentsIndexParams>) => reload(p), 
    loadMore, 
    hasMore, 
    reload 
  };
}
