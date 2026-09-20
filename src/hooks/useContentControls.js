import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useContentControls(contentType) {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('content_controls')
      .select('item_id,is_enabled,maintenance_message,updated_at')
      .eq('content_type', contentType);
    if (error) {
      console.error(`Không thể tải content_controls (${contentType}):`, error);
      setControls([]);
    } else {
      setControls(data || []);
    }
    setLoading(false);
  }, [contentType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const byId = useMemo(() => new Map(controls.map(control => [control.item_id, control])), [controls]);
  const getControl = useCallback(itemId => byId.get(itemId), [byId]);
  const isEnabled = useCallback(itemId => byId.get(itemId)?.is_enabled !== false, [byId]);

  return { controls, loading, reload, getControl, isEnabled };
}
