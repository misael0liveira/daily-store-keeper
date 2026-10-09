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
- Regressões locais: navegação, Pix, pagamentos, scanner e promoções passaram. Paleta:14 combinações; dimensões de pagamento:48 casos; Gestão:48 casos; Fiados:49 casos passaram. Sem falhas novas ou bugs S1 abertos.

## Bug reproduzido/corrigido

BUG-REPL-001: foco não retornava ao botão que abre Sheet por estado. geometry falhou antes da correção e passou depois. SheetContent agora captura controle de origem e respeita callbacks explícitos. X44×44,círculo e centro≤1px passaram nos três tamanhos.

## Limites de evidência

Bridge de câmera/notificações e clipboard são sintéticos. Leitor/notificações/copiar/imprimir/instalar realmente no aparelho dependem do teste físico. Não há mudança de Manifest, plugins Capacitor ou permissões.

## Android e publicação

- Workflow49 concluído com sucesso: https://github.com/misael0liveira/daily-store-keeper/actions/runs/37913781205 (job113764944210).
- Fonte: commit98397f16d9aa735beb9d66fc9b95a223e40fc4cd, árvore918ec6bb9e74e7d19ea810f4a15301b113c40027.
- Pipeline aprovou TypeScript,49 testes Node e todas as suítes de navegador, incluindo42 casos de reposição,49 Fiados,48 Gestão e48 dimensões de pagamentos.
- Gradle testDebugUnitTest/assembleRelease: BUILD SUCCESSFUL em1m52s. apksigner verify passou; a chave existente foi recuperada do cache mercadinho-vision-test-signing-v1.
- Release layout-test-49 aponta ao commit de fonte acima. APK: https://github.com/misael0liveira/daily-store-keeper/releases/download/layout-test-49/Mercadinho-Uniao-Teste.apk.
- Tamanho:30.221.612 bytes. SHA-256 publicado pelo GitHub: bf39a9616f81bbac412e849c3b669ebbf7ae9ee5314c8a27a680be40a713684e.
- VersionCode49, versionName layout-test.49; applicationId de teste app.minimarket.pos.visiontest. Atualização usa a mesma chave do teste48; instalação física não executada neste ambiente.

## Convergência Spec Kit

Resultado: converged. Conferidos8 requisitos FR,8 cenários de aceite,4 critérios SC,6 decisões de plano,5 princípios constitucionais e11 tarefas. Nenhuma lacuna missing/partial/contradicts/unrequested; nenhum achado CRITICAL/HIGH/MEDIUM/LOW. Código e evidências cobrem o escopo. A convergência não alterou tasks.md: hash antes/depois2e8f23c1027a8237a4cc3700104c76a3e31deaa4. Nenhuma fase vazia ou tarefa adicional criada. Sem hooks registrados.
