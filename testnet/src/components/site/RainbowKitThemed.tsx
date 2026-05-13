import { useMemo } from "react";
import type { ReactNode } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { useTheme } from "../../lib/theme";

/**
 * RainbowKit modal theme follows our ThemeProvider so the connect/account
 * modals don't feel pasted on when the rest of the page swaps light/dark.
 */
export default function RainbowKitThemed({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  const theme = useMemo(
    () =>
      isDark
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
    [isDark],
  );
  return (
    <RainbowKitProvider theme={theme} locale="en-US">
      {children}
    </RainbowKitProvider>
  );
}
