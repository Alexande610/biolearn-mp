import { supabase } from './supabase';
import { createErrorReportQueue } from './errorReportQueue';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';
const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || (import.meta.env.DEV ? 'development' : 'production');
const featureRequests = new Map();
let monitoringInstalled = false;
const errorReports = createErrorReportQueue(async payload => {
  const { _userId, ...rpcPayload } = payload;
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user?.id !== _userId) return false;
  const { data, error } = await supabase.rpc('report_client_error', rpcPayload);
  return !error && data?.accepted === true;
});
export const getErrorReportCounts = errorReports.getCounts;

const redactText = (value, maxLength = 1800) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<email>')
    .replace(/bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer <redacted>')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<jwt>')
    .replace(/[A-Za-z0-9_-]{40,}/g, '<secret>')
    .slice(0, maxLength);
};

const getRoute = () => {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.slice(0, 180);
};

const simpleHash = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const normalizeMessageForFingerprint = (message) => message
  .toLowerCase()
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '<uuid>')
  .replace(/\b\d{3,}\b/g, '<number>');

const toError = (value) => {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error('Unknown client error');
  }
};

export async function reportSystemError(errorLike, context = {}) {
  const route = getRoute();
  let userId;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data?.session?.user?.id;
  } catch { return false; }
  if (!userId) return false;
  const error = toError(errorLike);
  const action = redactText(context.action || 'client_runtime_error', 80);
  const message = redactText(error.message || 'Unknown client error', 600);
  const fingerprint = simpleHash(`${action}|${normalizeMessageForFingerprint(message)}|${route}`);

  const safeContext = {
    environment: APP_ENVIRONMENT,
    error_name: redactText(error.name || 'Error', 80),
    component: redactText(context.component, 100),
    operation: redactText(context.operation, 100),
    source: redactText(context.source, 80),
    status_code: redactText(context.statusCode ?? error.status, 12),
    supabase_code: redactText(context.supabaseCode ?? error.code, 60),
    browser: typeof navigator !== 'undefined' ? redactText(navigator.userAgent, 180) : '',
    online: typeof navigator !== 'undefined' ? String(navigator.onLine) : '',
    correlation_id: redactText(context.correlationId, 80),
    stack: redactText(error.stack, 1800),
  };

  return errorReports.report(`${userId}:${fingerprint}`, {
    _userId: userId,
    p_severity: context.severity || 'error',
    p_action: action,
    p_message: message,
    p_context: safeContext,
    p_route: route,
    p_app_version: APP_VERSION,
  });
}

export async function recordFeatureUsage(feature) {
  if (!feature) return false;
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const marker = `biolearn:metric:${localDate}:${feature}`;
  try {
    if (sessionStorage.getItem(marker)) return true;
  } catch {
    // Trinh duyet co the chan sessionStorage; RPC van tu chong trung o database.
  }

  if (featureRequests.has(marker)) return featureRequests.get(marker);

  const request = (async () => {
    try {
      const { data, error } = await supabase.rpc('record_daily_feature_usage', { p_feature: feature });
      if (error || data !== true) return false;
      try {
        sessionStorage.setItem(marker, '1');
      } catch {
        // Khong anh huong ung dung neu storage bi chan.
      }
      return true;
    } catch {
      return false;
    } finally {
      featureRequests.delete(marker);
    }
  })();
  featureRequests.set(marker, request);
  return request;
}

export function installGlobalErrorMonitoring() {
  if (monitoringInstalled || typeof window === 'undefined') return () => {};
  monitoringInstalled = true;

  const handleWindowError = (event) => {
    const resourceTarget = event.target;
    if (!event.error && resourceTarget && resourceTarget !== window) {
      reportSystemError(new Error(`Không tải được tài nguyên: ${resourceTarget.src || resourceTarget.href || 'unknown'}`), {
        action: 'client_resource_error',
        source: 'window.error',
        severity: 'warning',
      });
      return;
    }
    reportSystemError(event.error || event.message, {
      action: 'client_runtime_error',
      source: 'window.error',
    });
  };

  const handleUnhandledRejection = (event) => {
    reportSystemError(event.reason, {
      action: 'client_unhandled_rejection',
      source: 'unhandledrejection',
    });
  };

  window.addEventListener('error', handleWindowError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  return () => {
    window.removeEventListener('error', handleWindowError, true);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    monitoringInstalled = false;
  };
}
