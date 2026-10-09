# Research

## Decision: agregado local uma passagem

**Rationale**: produtos e vendas já estão em Zustand/localStorage. Indexar produto por ID/código; somar itens da janela e snapshots dos componentes evita buscas repetidas por produto. Memoização evita recalcular ao digitar. **Alternatives considered**: SQLite não existe; campos derivados persistidos exigiriam invalidação e escrita desnecessárias.

## Decision: identidade e devoluções

**Rationale**: ID estável conserva vendas ao trocar código. Fallback barcode só para legado sem ID. Usar qty-returnedQty e ignorar cancelled, sem descontar returns novamente. Combo soma consumo dos componentes históricos. Pesquisado por agente read-only sob speckit-plan.

## Decision: janela móvel720h, divisor30

**Rationale**: explícita e testável, como relatório de Gestão. Janela atualizada a cada minuto, ao foco/retomada e ao mudar as fontes. **Alternatives considered**:30datas locais teria outra fronteira, sem vantagem necessária neste pedido.

## Decision: exportação texto/PDF

**Rationale**: clipboard e jsPDF já adotados. Folha mostra texto mesmo sem acesso ao clipboard; PDF respeita paginação. **Alternatives considered**: plugin nativo novo de share não necessário.

## Decision: migração aditiva9

**Rationale**: configurações7/2 precisam entrar em instalação versão8; campos do backup opcionais/defaults compatíveis. Estoques/vendas/mínimo manual permanecem gravados.
