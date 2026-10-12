import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="pos-header">
      <div className="pos-header-heading">
        <span className="pos-brand-signature" aria-hidden="true">
          UNIÃO
        </span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}
