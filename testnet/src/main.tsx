import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { wagmiConfig } from "./lib/wagmi";
import { ThemeProvider } from "./components/site/ThemeProvider";
import RainbowKitThemed from "./components/site/RainbowKitThemed";
import "./lib/i18n";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitThemed>
            <App />
          </RainbowKitThemed>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </StrictMode>,
);
