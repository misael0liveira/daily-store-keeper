import { useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { CustomerForm } from "@/components/CustomerForm";
import { RecordList } from "@/components/ManagementUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  customerBalance,
  customerMatches,
  formatBRL,
  useStore,
  type Customer,
} from "@/store/useStore";
export function CustomerPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (c: Customer) => void;
}) {
  const state = useStore();
  const [query, setQuery] = useState("");
  const [scan, setScan] = useState(false);
  const [candidate, setCandidate] = useState<Customer>();
  const [creating, setCreating] = useState(false);
  const candidates = state.customers.filter((c) => c.active !== false && customerMatches(c, query));
  return (
    <Sheet
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent side="bottom" className="customer-sheet">
        <SheetTitle>Selecionar cliente</SheetTitle>
        <SheetDescription>
          Busque o cadastro ou leia o cartão. Confira o nome antes de vincular à compra.
        </SheetDescription>
        {creating ? (
          <CustomerForm
            onCancel={() => setCreating(false)}
            onSaved={(id) => {
              setCreating(false);
              setCandidate(useStore.getState().customers.find((c) => c.id === id));
            }}
          />
        ) : candidate ? (
          <div className="space-y-3">
            <h2 className="font-semibold break-words">{candidate.name}</h2>
            <p>
              {candidate.code} · {candidate.contact || "Sem contato"}
            </p>
            <p>Saldo em aberto {formatBRL(customerBalance(state, candidate.id))}</p>
            <Button className="w-full" onClick={() => onSelect(candidate)}>
              Confirmar este cliente
            </Button>
            <Button variant="outline" onClick={() => setCandidate(undefined)}>
              Escolher outro cliente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor="customer-picker-query" className="block text-sm font-medium">
              Buscar cliente para venda
            </label>
            <div className="flex gap-2">
              <Input
                id="customer-picker-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, código, CPF ou telefone"
              />
              {query && (
                <Button
                  variant="outline"
                  aria-label="Limpar busca de cliente"
                  onClick={() => {
                    setQuery("");
                    document.getElementById("customer-picker-query")?.focus();
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setScan((v) => !v)} aria-expanded={scan}>
                {scan ? "Fechar leitor de cliente" : "Ler QR do cliente"}
              </Button>
              <Button variant="outline" onClick={() => setCreating(true)}>
                Cadastrar novo cliente
              </Button>
            </div>
            {scan && (
              <BarcodeScanner
                purpose="customer"
                onScan={(code) => {
                  const id = code.startsWith("UNIAO:CLIENTE:")
                    ? code.slice("UNIAO:CLIENTE:".length)
                    : undefined;
                  const found = state.customers.find(
                    (c) =>
                      c.active !== false &&
                      (id ? c.id === id : c.code?.toLowerCase() === code.trim().toLowerCase()),
                  );
                  if (!found) {
                    toast.error("Cartão de cliente não encontrado neste aparelho.");
                    return;
                  }
                  setScan(false);
                  setCandidate(found);
                }}
              />
            )}
            <RecordList empty="Nenhum cliente encontrado.">
              {candidates.map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  className="w-full h-auto min-h-12 justify-between whitespace-normal gap-3"
                  onClick={() => {
                    setScan(false);
                    setCandidate(c);
                  }}
                >
                  <span>
                    {c.name} · {c.code}
                  </span>
                  <span>{formatBRL(customerBalance(state, c.id))}</span>
                </Button>
              ))}
            </RecordList>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
