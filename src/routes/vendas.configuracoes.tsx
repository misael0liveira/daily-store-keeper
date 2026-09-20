import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PixNotificationSettings } from "@/components/PixNotificationSettings";
import { PixQr } from "@/components/PixQr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildPixPayload } from "@/lib/pix";
import { useStore } from "@/store/useStore";

export const Route = createFileRoute("/vendas/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações de vendas — Mini Mercado PDV" },
      {
        name: "description",
        content:
          "Cadastre a chave Pix do mini mercado e o nome usado nos relatórios de vendas.",
      },
      {
        property: "og:title",
        content: "Configurações de vendas — Mini Mercado PDV",
      },
      {
        property: "og:description",
        content: "Chave Pix, recebedor e nome da loja para recibos e PDFs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [merchantName, setMerchantName] = useState(settings.merchantName);
  const [city, setCity] = useState(settings.city);

  const preview = pixKey.trim()
    ? buildPixPayload({
        key: pixKey,
        merchantName: merchantName || storeName,
        city,
      })
    : "";

  const save = () => {
    if (!pixKey.trim()) {
      toast.error("Informe a chave Pix");
      return;
    }
    setSettings({
      storeName: storeName.trim() || "Mini Mercado",
      pixKey: pixKey.trim(),
      merchantName: merchantName.trim(),
      city: city.trim(),
    });
    toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="size-11">
          <Link to="/vendas" aria-label="Voltar para vendas">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="font-display text-3xl tracking-wide">Configurações</h1>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="storeName">Nome do mercado</Label>
          <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex.: Mercado do Bairro" className="h-12 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pixKey">Chave Pix</Label>
          <Input id="pixKey" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF/CNPJ, telefone, e-mail ou chave aleatória" className="h-12 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="merchantName">Nome do recebedor</Label>
          <Input id="merchantName" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Como aparece no Pix" className="h-12 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Sao Paulo" className="h-12 text-base" />
        </div>
        <Button className="h-14 w-full gap-2 text-lg" onClick={save}>
          <Save className="size-5" />
          Salvar configurações
        </Button>
      </div>

      <PixNotificationSettings />

      {preview && (
        <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Prévia do QR Code (sem valor)</p>
          <PixQr payload={preview} size={180} />
          <p className="text-center text-xs text-muted-foreground">
            Teste com o app do seu banco para conferir se a chave está correta.
          </p>
        </div>
      )}
    </div>
  );
}
