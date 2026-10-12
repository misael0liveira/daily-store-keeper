import { PageHeader } from "@/components/PageHeader";
import { createFileRoute } from "@tanstack/react-router";
import { CustomersPanel } from "@/components/CustomersPanel";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Fiados — Mercadinho União" }] }),
  component: FiadosPage,
});
function FiadosPage() {
  return (
    <div className="pos-page">
      <PageHeader title="Fiados" subtitle="Contas dos clientes" />
      <CustomersPanel />
    </div>
  );
}
