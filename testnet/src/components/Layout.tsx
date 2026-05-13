import { Outlet } from "react-router-dom";
import ChainGate from "./ChainGate";
import TestnetNav from "./site/TestnetNav";
import TestnetFooter from "./site/TestnetFooter";

export default function Layout() {
  return (
    <ChainGate>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <TestnetNav />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-14 py-10 md:py-14">
          <Outlet />
        </main>
        <TestnetFooter />
      </div>
    </ChainGate>
  );
}
