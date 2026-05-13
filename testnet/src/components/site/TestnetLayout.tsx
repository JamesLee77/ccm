import Nav from "./Nav";
import Footer from "./Footer";
import TestnetBanner from "./TestnetBanner";

export default function TestnetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <TestnetBanner />
      <div style={{ flex: 1, maxWidth: 880, margin: "0 auto", padding: "32px 24px", width: "100%" }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
