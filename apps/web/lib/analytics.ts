type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...command: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

let enabled = false;
let initialized = false;
let ownedScript: HTMLScriptElement | null = null;
let lastPath: string | null = null;
let pendingPaths: string[] = [];
const queuedCommands = new Set<unknown>();

function measurementId(): string | null {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return value && /^G-[A-Z0-9]+$/.test(value) ? value : null;
}

function analyticsWindow(): AnalyticsWindow {
  return window as unknown as AnalyticsWindow;
}

function command(...values: unknown[]): void {
  if (enabled) analyticsWindow().gtag?.(...values);
}

function pageView(path: string): void {
  command("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}

export function trackAnalyticsPage(path: string): void {
  const id = measurementId();
  if (typeof window === "undefined" || !id) return;

  const browser = analyticsWindow();
  enabled = true;
  browser[`ga-disable-${id}`] = false;
  if (path === lastPath) return;
  lastPath = path;

  if (initialized) {
    pageView(path);
    return;
  }

  pendingPaths.push(path);
  if (ownedScript) return;

  browser.dataLayer ??= [];
  browser.gtag ??= function (...values: unknown[]) {
    if (!enabled) return;
    const entry = {
      ...values,
      length: values.length,
      [Symbol.toStringTag]: "Arguments",
    };
    queuedCommands.add(entry);
    browser.dataLayer?.push(entry);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.portfolioAnalytics = "true";
  script.onload = () => {
    if (!enabled || ownedScript !== script || browser[`ga-disable-${id}`])
      return;
    if (!initialized) {
      initialized = true;
      command("js", new Date());
      command("config", id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
    const paths = pendingPaths;
    pendingPaths = [];
    paths.forEach(pageView);
  };
  script.onerror = () => {
    if (ownedScript !== script) return;
    script.remove();
    ownedScript = null;
    pendingPaths = [];
    lastPath = null;
  };
  ownedScript = script;
  document.head.appendChild(script);
}

function clearAnalyticsCookies(): void {
  const paths = new Set(["/"]);
  const segments = window.location.pathname.split("/").filter(Boolean);
  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    paths.add(path);
    paths.add(`${path}/`);
  }

  const domains = [""];
  const hostname = window.location.hostname;
  const labels = hostname.split(".");
  for (let index = 0; index < labels.length; index += 1) {
    const domain = labels.slice(index).join(".");
    domains.push(`; Domain=${domain}`, `; Domain=.${domain}`);
  }

  try {
    const names = document.cookie
      .split(";")
      .map((cookie) => cookie.trim().split("=")[0]);
    for (const name of names) {
      if (!/^(_ga(?:_.*)?|_gid|_gat.*)$/.test(name)) continue;
      for (const cookiePath of paths) {
        for (const domain of domains) {
          document.cookie = `${name}=; Max-Age=0; Path=${cookiePath}${domain}`;
        }
      }
    }
  } catch {
    return;
  }
}

export function disableAnalytics(): void {
  const id = measurementId();
  if (typeof window === "undefined" || !id) return;

  const browser = analyticsWindow();
  browser[`ga-disable-${id}`] = true;
  enabled = false;
  pendingPaths = [];
  lastPath = null;
  if (ownedScript) {
    ownedScript.onload = null;
    ownedScript.onerror = null;
    ownedScript.remove();
    ownedScript = null;
  }
  if (browser.dataLayer) {
    for (let index = browser.dataLayer.length - 1; index >= 0; index -= 1) {
      if (queuedCommands.has(browser.dataLayer[index]))
        browser.dataLayer.splice(index, 1);
    }
  }
  queuedCommands.clear();
  clearAnalyticsCookies();
}
