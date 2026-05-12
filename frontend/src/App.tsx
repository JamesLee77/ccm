import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/site/Layout";
import Earth from "./pages/Earth";
import Whitepaper from "./pages/Whitepaper";
import Defi from "./pages/Defi";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";

export default function App() {
  return (
    <Routes>
      {/* Marketing routes share the default Layout (light, theme-toggleable). */}
      <Route element={<Layout />}>
        <Route index element={<Earth />} />
        <Route path="whitepaper" element={<Whitepaper />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="disclaimer" element={<Disclaimer />} />
        {/* Legacy stub routes — redirect to home anchors. */}
        <Route path="ccmine" element={<Navigate to="/#mining" replace />} />
        <Route path="tokenomics" element={<Navigate to="/#tokenomics" replace />} />
        <Route path="roadmap" element={<Navigate to="/#roadmap" replace />} />
      </Route>
      {/* Dark-only routes — each wraps its own ThemeProvider(force="dark"). */}
      <Route path="defi" element={<Defi />} />
      {/* Phase 0: no mainnet app yet. Old /markets route redirects to the
          public testnet sandbox (per docs/ccm-phase0-architecture.md §4.1). */}
      <Route
        path="markets"
        element={<ExternalRedirect to="https://testnet.ccmnetwork.net" />}
      />
    </Routes>
  );
}

function ExternalRedirect({ to }: { to: string }) {
  if (typeof window !== "undefined") {
    window.location.replace(to);
  }
  return null;
}
