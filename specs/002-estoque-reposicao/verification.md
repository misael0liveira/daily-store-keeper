# Verification — reposição local

## Spec Kit

Especificação, plano, pesquisa, modelo, contrato e11tarefas criados em specs/002-estoque-reposicao. Checklist aprovado; análise de consistência sem conflitos de constituição ou requisitos descobertos sem cobertura. Sem extensions.yml, portanto sem hooks registrados. Pesquisa read-only fundamentou identidade/composição/devoluções no código. Ponytail full: cálculo derivado, dependências existentes, sem serviço/colunas derivadas.

## Checks locais

- tsc --noEmit: passou.
- ESLint nos13arquivos TypeScript afetados (incluindo ManagementUI e Sheet): passou sem warnings.
- Node tests/*.test.mjs:49/49 passaram, incluindo8casos novos de reposição/migração/desempenho.
- calculateReplenishment,10milvendas/2milprodutos:4,84ms em Node24.19/linux; não representa medição Android.
- Build web: passou; cópia de _shell.html→index.html segue pipeline existente.
- replica-test reposição:42/42 casos,320/360/430px,claro/escuro,axe,console/5xx,copy simulado sucesso/falha,PDF real,backup novo/antigo,offline e foco/carrinho.
- PDF real conferido com pdftotext: uma linha Arroz São João, saldo20, mínimo20, alvo90, compra70; nenhum produto oculto.
- Auditoria premium strict:0unresolved,0violations,0warnings; nenhum token de cor alterado.
- git diff --check: passou.

## Bug reproduzido/corrigido

BUG-REPL-001: foco não retornava ao botão que abre Sheet por estado. geometry falhou antes da correção e passou depois. SheetContent agora captura controle de origem e respeita callbacks explícitos. X44×44,círculo e centro≤1px passaram nos três tamanhos.

## Limites de evidência

Bridge de câmera/notificações e clipboard são sintéticos. Leitor/notificações/copiar/imprimir/instalar realmente no aparelho dependem do teste físico. Não há mudança de assinatura, Manifest, plugins Capacitor ou permissões. Gradle/apksigner e release serão registrados após pipeline do APK teste. Regressões amplas em execução.
