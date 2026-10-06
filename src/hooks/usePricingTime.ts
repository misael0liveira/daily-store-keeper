import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

export function usePricingTime() {
  const products = useStore((s) => s.products);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!Object.values(products).some((p) => p.promotion?.mode === "period")) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [products]);
  return now;
}
