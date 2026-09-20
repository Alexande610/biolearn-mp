import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { createOnlinePresence } from '../lib/onlinePresence';
import { reportSystemError } from '../lib/observability';

const presence = createOnlinePresence(supabase, error => reportSystemError(error, {
  action: 'online_presence_error', operation: 'presence', severity: 'warning',
}));

// Call only from App. Consumers read the snapshot through AuthContext.
export function useOnlinePresence(userId) {
  useEffect(() => presence.start(userId), [userId]);
  return useSyncExternalStore(presence.subscribe, presence.getSnapshot, presence.getSnapshot);
}
