import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatBRL } from "@/store/useStore";

export function PaymentSuccess({
  amount,
  bank,
  onDone,
  detail = "Venda confirmada",
  heading = "Pagamento recebido!",
}: {
  amount: number;
  bank: string | undefined;
  onDone: () => void;
  detail?: string | undefined;
  heading?: string;
}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const timeout = window.setTimeout(() => onDoneRef.current(), 2000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div
      className="absolute inset-0 flex min-h-dvh flex-col items-center justify-center overflow-hidden payment-success px-6"
      role="status"
      aria-live="assertive"
      aria-label={heading === "Pagamento recebido!" ? "Pagamento recebido" : heading}
    >
      <style>{`
        @keyframes pixRingIn { 0% { transform: scale(.72); opacity: 0; } 35% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.08); opacity: 0; } }
        @keyframes pixRingPulse { 0%, 100% { transform: scale(.96); opacity: .2; } 50% { transform: scale(1.04); opacity: .55; } }
        @keyframes pixCircle { 0% { stroke-dashoffset: 330; } 58% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes pixCheck { 0% { stroke-dashoffset: 80; opacity: 0; } 55% { stroke-dashoffset: 80; opacity: 0; } 78% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes pixDot { 0% { transform: translateY(12px) scale(.4); opacity: 0; } 35% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-26px) scale(.8); opacity: 0; } }
        @keyframes pixText { 0%, 45% { opacity: 0; transform: translateY(8px); } 72%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pixGlow { 0%, 35% { opacity: 0; transform: scale(.7); } 70%, 100% { opacity: 1; transform: scale(1); } }
        .pix-success-ring { animation: pixRingIn 1.15s cubic-bezier(.2,.8,.2,1) both; }
        .pix-success-pulse { animation: pixRingPulse 1.35s ease-in-out .1s infinite; }
        .pix-success-circle { stroke-dasharray: 330; stroke-dashoffset: 330; animation: pixCircle 1.25s cubic-bezier(.65,0,.35,1) .05s both; }
        .pix-success-check { stroke-dasharray: 80; stroke-dashoffset: 80; animation: pixCheck 1.25s cubic-bezier(.65,0,.35,1) .05s both; }
        .pix-success-dot { animation: pixDot 1.25s ease-out .15s both; }
        .pix-success-text { animation: pixText 1.35s ease-out .1s both; }
        .pix-success-glow { animation: pixGlow 1.2s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .pix-success-ring, .pix-success-pulse, .pix-success-circle, .pix-success-check, .pix-success-dot, .pix-success-text, .pix-success-glow {
            animation: none !important; opacity: 1 !important; transform: none !important; stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
      <div className="relative flex size-[260px] items-center justify-center sm:size-[300px]">
        <div className="pix-success-glow absolute size-[230px] rounded-full payment-success-glow blur-3xl sm:size-[270px]" />
        <div className="pix-success-pulse absolute size-[205px] rounded-full border payment-success-pulse sm:size-[245px]" />
        <div className="pix-success-ring absolute size-[190px] rounded-full border payment-success-ring sm:size-[220px]" />
        <svg
          viewBox="0 0 140 140"
          className="relative size-[190px] payment-success-icon sm:size-[220px]"
          aria-hidden="true"
        >
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="color-mix(in srgb, var(--on-brand) 8%, transparent)"
            stroke="color-mix(in srgb, var(--on-brand) 24%, transparent)"
            strokeWidth="2"
          />
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke="var(--success-glow)"
            strokeWidth="8"
            strokeLinecap="round"
            className="pix-success-circle"
            transform="rotate(-90 70 70)"
          />
          <path
            d="M43 71.5 61 89 99 51"
            fill="none"
            stroke="var(--on-brand)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pix-success-check"
          />
        </svg>
        <span className="pix-success-dot absolute left-1/2 top-1/2 size-3 -translate-x-1/2 rounded-full payment-success-dot" />
      </div>
      <div className="pix-success-text -mt-3 text-center">
        <p className="text-[30px] font-semibold tracking-tight sm:text-[34px]">{heading}</p>
        <p className="mt-3 text-[28px] font-medium tracking-tight payment-success-accent">
          {formatBRL(amount)}
        </p>
        {bank && <p className="mt-2 text-sm font-medium payment-success-accent">{bank}</p>}
        <div className="mt-7 flex items-center justify-center gap-2 text-sm payment-success-accent">
          <Check className="size-4" />
          {detail}
        </div>
      </div>
    </div>
  );
}
