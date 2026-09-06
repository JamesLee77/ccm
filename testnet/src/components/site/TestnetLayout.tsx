import Nav from "./Nav";
import Footer from "./Footer";
import TestnetBanner from "./TestnetBanner";

export default function TestnetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Nav />
      <TestnetBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
