import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Sale from "./pages/Sale";
import Dashboard from "./pages/Dashboard";
import Vesting from "./pages/Vesting";
import Settings from "./pages/Settings";
import Migrate from "./pages/Migrate";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="sale" element={<Sale />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vesting" element={<Vesting />} />
        <Route path="settings" element={<Settings />} />
        <Route path="migrate" element={<Migrate />} />
      </Route>
    </Routes>
  );
}
