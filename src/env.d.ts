// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="../vendor/integration/types.d.ts" />

// Globals set by src/components/promdi/Tracking.astro.
interface Window {
  ppTrack?: (name: string, params?: Record<string, string>) => void;
  ppAttribution?: () => Record<string, string>;
  ppEventLog?: [string, Record<string, string>][];
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  umami?: { track: (name: string, data?: Record<string, string>) => void };
}
