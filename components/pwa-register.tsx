"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // The worker caches /_next/static/ cache-first, which is safe in
    // production because those filenames carry a content hash. Dev filenames
    // are not hashed and get reused across rebuilds, so a cached chunk can
    // shadow an edited one — the page then hydrates old client JS against
    // fresh server HTML and React tears the tree down. Keep it out of dev,
    // and clean up after any worker a previous dev session installed.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) if (key.startsWith("jobdd-")) caches.delete(key);
        });
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
