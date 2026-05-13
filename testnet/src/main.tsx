import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { wagmiConfig } from "./lib/wagmi";
import { ThemeProvider } from "./components/site/ThemeProvider";
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
          <RainbowKitProvider locale="en-US">
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </StrictMode>,
);
