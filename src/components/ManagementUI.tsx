import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FormError = createContext<{ error: string; id: string }>({ error: "", id: "" });
export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  inputMode,
  placeholder,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  invalid?: boolean;
}) {
  const id = useId();
  const form = useContext(FormError);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={invalid || (Boolean(form.error) && required && !value.trim())}
        aria-describedby={form.error ? form.id : undefined}
        className="h-12"
      />
    </div>
  );
}
export function Choice({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="management-select"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
export function LocalForm({
  children,
  onSave,
  label = "Salvar",
  success = "Registro salvo",
  disabled = false,
}: {
  children: ReactNode;
  onSave: () => void | Promise<void>;
  label?: string;
  success?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });
  const locked = useRef(false);
  const errorId = useId();
  return (
    <FormError.Provider value={{ error, id: errorId }}>
      <form
        noValidate
        className="management-form"
        onChange={() => {
          setError("");
          setDirty(true);
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (locked.current) return;
          const form = e.currentTarget;
          const first = Array.from(form.elements).find(
            (el) => el instanceof HTMLInputElement && el.required && !el.value.trim(),
          ) as HTMLInputElement | undefined;
          if (first) {
            setError("Preencha os campos obrigatórios.");
            first.focus();
            return;
          }
          locked.current = true;
          setBusy(true);
          setError("");
          try {
            await onSave();
            setDirty(false);
            toast.success(success);
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Não foi possível salvar. Tente novamente.",
            );
            (form.querySelector("input, select") as HTMLElement | null)?.focus();
          } finally {
            locked.current = false;
            setBusy(false);
          }
        }}
      >
        {children}
        {error && (
          <p id={errorId} role="alert" className="management-error">
            {error}
          </p>
        )}
        <Button type="submit" className="h-12 w-full" disabled={busy || disabled} aria-busy={busy}>
          {busy ? "Salvando…" : label}
        </Button>
      </form>
      <AlertDialog open={blocker.status === "blocked"}>
        <AlertDialogContent>
          <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
          <AlertDialogDescription>
            As alterações deste formulário ainda não foram registradas.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDirty(false);
                blocker.proceed?.();
              }}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormError.Provider>
  );
}
export function ConfirmAction({
  label,
  title,
  description,
  onConfirm,
  disabled = false,
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          setOpen(v);
          setError("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-auto min-h-11 max-w-full whitespace-normal"
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        {error && (
          <p role="alert" className="management-error">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              if (locked.current) return;
              locked.current = true;
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Não foi possível concluir.");
              } finally {
                setBusy(false);
                locked.current = false;
              }
            }}
          >
            {busy ? "Aguarde…" : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function RecordList({
  children,
  empty = "Nenhum registro ainda.",
}: {
  children: ReactNode[];
  empty?: string;
}) {
  const [limit, setLimit] = useState(20);
  return (
    <div className="space-y-3">
      {children.length ? children.slice(0, limit) : <p className="pos-empty">{empty}</p>}
      {children.length > limit && (
        <Button variant="outline" className="w-full" onClick={() => setLimit((n) => n + 20)}>
          Ver mais registros ({children.length - limit})
        </Button>
      )}
    </div>
  );
}
export function RecordCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="pos-card space-y-2">
      <h3 className="font-semibold break-words">{title}</h3>
      {children}
    </article>
  );
}
