import { Outlet } from "react-router-dom";
import PortalNav from "./site/PortalNav";
import PortalFooter from "./site/PortalFooter";

export default function Layout() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <PortalNav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-14 py-10 md:py-14">
        <Outlet />
      </main>
      <PortalFooter />
    </div>
  );
}
