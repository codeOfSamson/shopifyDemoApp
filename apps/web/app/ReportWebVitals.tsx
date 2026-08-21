"use client";

import { useReportWebVitals } from "next/web-vitals";

export function ReportWebVitals() {
  useReportWebVitals((metric) => {
    fetch("/api/observability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metricName: metric.name, value: metric.value, id: metric.id }),
      keepalive: true,
    }).catch(() => {
      // Best-effort telemetry — a failed beacon shouldn't affect the page.
    });
  });

  return null;
}
