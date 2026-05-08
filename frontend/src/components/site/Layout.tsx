import { Outlet } from "react-router-dom";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";

/**
 * Default site layout — used by all marketing pages and as the parent
 * route. Dark-only routes (/defi, /markets) wrap themselves in
 * <ThemeProvider force="dark"> on top of this.
 */
export default function Layout() {
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
