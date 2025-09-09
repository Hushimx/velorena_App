import { useCallback, useEffect, useState } from 'react';
import { deleteOrder, getOrderById } from '../utils/api';

export function useOrder(id?: number | string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await getOrderById(id);
      const payload = res?.data ?? res;
      setData(payload ?? null);
    } catch (e: any) { setError(e?.message || 'Unable to load order'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const remove = useCallback(async () => {
    if (!id) return false;
    if (data?.status !== 'pending') { setError('You can only delete orders with a pending status.'); return false; }
    setLoading(true); setError(null);
    try {
      const res = await deleteOrder(id);
      if ((res?.success ?? true) !== true) throw new Error(res?.message || 'Failed to delete');
      // Update the order status to deleted instead of removing it completely
      setData((prev: any) => prev ? { ...prev, status: 'deleted' } : null);
      return true;
    } catch (e: any) { setError(e?.message || 'Unable to delete order'); return false; }
    finally { setLoading(false); }
  }, [id, data]);

  return { data, loading, error, reload, remove };
}
