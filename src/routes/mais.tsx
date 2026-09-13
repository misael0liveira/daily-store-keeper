import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mais")({
  head: () => ({
    meta: [
      { title: "Mais — Mini Market POS" },
      { name: "description", content: "Relatórios de vendas e configurações do Mini Market POS." },
      { property: "og:title", content: "Mais — Mini Market POS" },
      { property: "og:description", content: "Acesse relatórios e configurações do mini mercado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground">Operação</p>
        <h1 className="mt-1 text-2xl font-extrabold">Mais</h1>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <Button asChild variant="ghost" className="h-18 w-full justify-start rounded-none px-4">
          <Link to="/vendas">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary"><FileText className="size-5 text-primary" /></span>
            <span className="min-w-0 flex-1 text-left"><strong className="block">Vendas e relatórios</strong><span className="block truncate text-xs font-normal text-muted-foreground">Histórico, períodos e PDF</span></span>
            <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-18 w-full justify-start rounded-none border-t px-4">
          <Link to="/vendas/configuracoes">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary"><Settings className="size-5 text-primary" /></span>
            <span className="min-w-0 flex-1 text-left"><strong className="block">Configurações</strong><span className="block truncate text-xs font-normal text-muted-foreground">Mercado, Pix e recebedor</span></span>
            <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  );
}