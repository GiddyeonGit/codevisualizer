import { useEffect } from "react";
import { useInteractionStore } from "@/entities/interaction-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useInteractionStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("codevisualizer-theme", theme);
    } catch {
      // localStorage not available
    }
  }, [theme]);

  return <>{children}</>;
}
