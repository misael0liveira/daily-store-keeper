import { createFileRoute } from "@tanstack/react-router";
import { CustomersPanel } from "@/components/CustomersPanel";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Fiados — Mercadinho União" }] }),
  component: FiadosPage,
});
function FiadosPage() {
  return (
    <div className="pos-page">
      <header className="pos-header">
        <h1>Fiados</h1>
      </header>
      <CustomersPanel />
    </div>
  );
}
