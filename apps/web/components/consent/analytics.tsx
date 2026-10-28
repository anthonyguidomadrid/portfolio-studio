"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useConsent } from "@/components/consent/provider";
import { disableAnalytics, trackAnalyticsPage } from "@/lib/analytics";

export function Analytics() {
  const { ready, choices } = useConsent();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (!ready || !choices.analytics) {
      disableAnalytics();
      return;
    }
    trackAnalyticsPage(`${pathname}${search ? `?${search}` : ""}`);
  }, [ready, choices.analytics, pathname, search]);

  return null;
}
