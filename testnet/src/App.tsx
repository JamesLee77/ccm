import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Demo from "./pages/Demo";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="demo" element={<Demo />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
