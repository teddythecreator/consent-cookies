import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Configurator from "./components/Configurator";
import Features from "./components/Features";
import Comparison from "./components/Comparison";
import CodeShowcase from "./components/CodeShowcase";
import Pricing from "./components/Pricing";
import { Faq, Reviews } from "./components/Social";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/shared";

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {/* layered glows */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-deep/14 blur-[130px]" />
      <div className="absolute top-[30%] -right-48 h-[560px] w-[560px] rounded-full bg-azure/9 blur-[140px]" />
      <div className="absolute bottom-[-220px] left-[28%] h-[480px] w-[480px] rounded-full bg-teal/7 blur-[130px]" />
      {/* grid */}
      <div className="bg-grid absolute inset-x-0 top-0 h-[720px]" />
      {/* drifting particles */}
      {[
        { top: "18%", left: "8%", delay: "0s", color: "bg-azure/50" },
        { top: "32%", left: "88%", delay: "1.2s", color: "bg-teal/50" },
        { top: "64%", left: "6%", delay: "2.1s", color: "bg-amber/40" },
        { top: "78%", left: "78%", delay: "0.7s", color: "bg-azure/40" },
        { top: "12%", left: "62%", delay: "1.7s", color: "bg-teal/40" },
      ].map((p, i) => (
        <span
          key={i}
          className={`animate-float absolute h-1.5 w-1.5 rounded-full ${p.color}`}
          style={{ top: p.top, left: p.left, animationDelay: p.delay }}
        />
      ))}
      {/* grain */}
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-ink font-body text-snow antialiased">
        <AmbientBackground />
        <div className="relative z-10">
          <Nav />
          <main>
            <Hero />
            <Configurator />
            <Features />
            <Comparison />
            <CodeShowcase />
            <Pricing />
            <Reviews />
            <Faq />
          </main>
          <Footer />
        </div>
      </div>
    </ToastProvider>
  );
}
