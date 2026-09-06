import { useMemo } from "react";
import type { ReactNode } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { useTheme } from "./ThemeProvider";

/**
 * RainbowKit modal + connect button follow the page theme so they don't
 * feel pasted on. Moss accent, sharp corners — same as ccmnetwork.net.
 */
export default function RainbowKitThemed({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const rkTheme = useMemo(
    () =>
      theme === "dark"
        ? darkTheme({
            accentColor: "#2dbf63",
            accentColorForeground: "#0a0e0c",
            borderRadius: "none",
            fontStack: "system",
          })
        : lightTheme({
            accentColor: "#2dbf63",
            accentColorForeground: "#f5f3ec",
            borderRadius: "none",
            fontStack: "system",
          }),
    [theme],
  );
  return (
    <RainbowKitProvider theme={rkTheme} locale="en-US">
      {children}
    </RainbowKitProvider>
  );
}
