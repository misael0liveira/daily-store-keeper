import { useEffect, useMemo, useState } from "react";
import { calculateReplenishment } from "@/lib/stockReplenishment";
import { useStore } from "@/store/useStore";

export function useReplenishment() {
  const products = useStore((s) => s.products);
  const sales = useStore((s) => s.sales);
  const settings = useStore((s) => s.settings);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setClock(Date.now());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  // Date.now inclui uma venda recém-concluída mesmo antes do próximo tick.
  return useMemo(
    () => calculateReplenishment(products, sales, settings, Math.max(clock, Date.now())),
    [products, sales, settings, clock],
  );
}
