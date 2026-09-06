import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import { scrollToId } from "../../lib/scroll";

/**
 * Scrolls to the element matching `location.hash` after route renders.
 * Retries briefly because section content may mount async.
 */
function useScrollToHash() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let attempts = 0;
    const tryScroll = () => {
      if (scrollToId(id, "smooth")) return;
      if (attempts++ < 20) setTimeout(tryScroll, 50);
    };
    tryScroll();
  }, [pathname, hash, key]);
}

export default function Layout() {
  useScrollToHash();
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
