import { useMemo } from "react";
import type { ReactNode } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { useTheme } from "../../lib/theme";
import { IS_MAINNET } from "../../lib/env";

/**
 * RainbowKit modal theme follows our ThemeProvider so the connect/account
 * modals don't feel pasted on when the rest of the page swaps light/dark.
 *
 * Accent encodes the build env so the modal echoes the operator's mental
 * model: moss = mainnet (real), clay = testnet (rehearsal).
 */
export default function RainbowKitThemed({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  const accent = IS_MAINNET ? "#2dbf63" /* moss */ : "#c8602e" /* clay */;
  const theme = useMemo(
    () =>
      isDark
        ? darkTheme({
            accentColor: accent,
            accentColorForeground: "#0a0e0c",
            borderRadius: "none",
            fontStack: "system",
          })
        : lightTheme({
            accentColor: accent,
            accentColorForeground: "#f5f3ec",
            borderRadius: "none",
            fontStack: "system",
          }),
    [isDark, accent],
  );
  return (
    <RainbowKitProvider theme={theme} locale="en-US">
      {children}
    </RainbowKitProvider>
  );
}
