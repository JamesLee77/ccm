import Nav from "./Nav";
import Footer from "./Footer";
import TestnetBanner from "./TestnetBanner";

export default function TestnetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <TestnetBanner />
      <div className="r-content">
        {children}
      </div>
      <Footer />
    </div>
  );
}
