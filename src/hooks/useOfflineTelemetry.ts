import { useEffect, useState } from 'react';

// Global singleton to track intercepted network activity
interface TelemetryState {
  externalRequests: number;
  blockedUrls: string[];
  listeners: Set<() => void>;
}

const telemetryState: TelemetryState = {
  externalRequests: 0,
  blockedUrls: [],
  listeners: new Set(),
};

let interceptorInstalled = false;

function isExtensionOrLocal(url: string): boolean {
  if (!url) return true;
  const str = String(url).toLowerCase();
  return (
    str.startsWith('chrome-extension://') ||
    str.startsWith('moz-extension://') ||
    str.startsWith('safari-extension://') ||
    str.startsWith('edge-extension://') ||
    str.startsWith('blob:') ||
    str.startsWith('data:')
  );
}

export function installNetworkPrivacyInterceptor() {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;

  // 1. Monkey-patch window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
    if (!isExtensionOrLocal(url)) {
      telemetryState.externalRequests++;
      telemetryState.blockedUrls.push(url);
      telemetryState.listeners.forEach((fn) => fn());
      console.warn(`[FormEase Privacy Monitor] External fetch intercepted to: ${url}`);
    }
    return originalFetch.apply(this, args);
  };

  // 2. Monkey-patch XMLHttpRequest.prototype.open
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args: any[]) {
    const url = String(args[1] || '');
    if (!isExtensionOrLocal(url)) {
      telemetryState.externalRequests++;
      telemetryState.blockedUrls.push(url);
      telemetryState.listeners.forEach((fn) => fn());
      console.warn(`[FormEase Privacy Monitor] External XHR intercepted to: ${url}`);
    }
    return (originalOpen as any).apply(this, args);
  };
}

// Auto-install immediately on script evaluation
installNetworkPrivacyInterceptor();

export function useOfflineTelemetry() {
  const [requestCount, setRequestCount] = useState(telemetryState.externalRequests);

  useEffect(() => {
    const update = () => setRequestCount(telemetryState.externalRequests);
    telemetryState.listeners.add(update);
    return () => {
      telemetryState.listeners.delete(update);
    };
  }, []);

  return {
    isFullyOffline: requestCount === 0,
    requestCount,
    blockedUrls: telemetryState.blockedUrls,
  };
}
