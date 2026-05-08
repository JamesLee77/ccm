import { Route, Routes } from "react-router-dom";
import Layout from "./components/site/Layout";
import Earth from "./pages/Earth";
import Ccmine from "./pages/Ccmine";
import Tokenomics from "./pages/Tokenomics";
import Roadmap from "./pages/Roadmap";
import Whitepaper from "./pages/Whitepaper";
import Defi from "./pages/Defi";
import Markets from "./pages/Markets";

export default function App() {
  return (
    <Routes>
      {/* Marketing routes share the default Layout (light, theme-toggleable). */}
      <Route element={<Layout />}>
        <Route index element={<Earth />} />
        <Route path="ccmine" element={<Ccmine />} />
        <Route path="tokenomics" element={<Tokenomics />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="whitepaper" element={<Whitepaper />} />
      </Route>
      {/* Dark-only app routes — each wraps its own ThemeProvider(force="dark"). */}
      <Route path="defi" element={<Defi />} />
      <Route path="markets" element={<Markets />} />
    </Routes>
  );
}
