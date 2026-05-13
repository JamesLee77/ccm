import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import TokenAdmin from "./pages/TokenAdmin";
import TgeAdmin from "./pages/TgeAdmin";
import VestingAdmin from "./pages/VestingAdmin";
import TimelockAdmin from "./pages/TimelockAdmin";
import KycAdmin from "./pages/KycAdmin";
import E2eSetup from "./pages/E2eSetup";
import { IS_MAINNET } from "./lib/env";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TokenAdmin />} />
        <Route path="tge" element={<TgeAdmin />} />
        <Route path="vesting" element={<VestingAdmin />} />
        <Route path="timelock" element={<TimelockAdmin />} />
        <Route path="kyc" element={<KycAdmin />} />
        {!IS_MAINNET && <Route path="e2e" element={<E2eSetup />} />}
      </Route>
    </Routes>
  );
}
