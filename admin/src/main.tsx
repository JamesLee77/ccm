import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { config } from "./lib/wagmi";
import ThemeProvider from "./components/site/ThemeProvider";
import RainbowKitThemed from "./components/site/RainbowKitThemed";
import E2eAutoConnect from "./e2e/E2eAutoConnect";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitThemed>
            <BrowserRouter>
              <E2eAutoConnect />
              <App />
            </BrowserRouter>
          </RainbowKitThemed>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
