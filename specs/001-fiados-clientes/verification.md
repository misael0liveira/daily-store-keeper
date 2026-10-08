# Verificação — Fiados

## Resultados locais

- Node: 41/41 regressões monetárias, estoque, migração, permissões e rollback passaram.
- Fiados: 49 casos de navegador passaram, incluindo quatro meios e dinheiro+Pix, cadastro/CPF, busca sem resultados, QR/cartão PDF, backup/restauração e recarga offline. Regressão adicional de cotação abandonada passou após reproduzir e corrigir FIA-02.
- TypeScript e build web passaram; lint de todos os arquivos de código/teste afetados passou.
- Auditoria premium strict: zero findings. DESIGN.md lint: zero erros/avisos; diff sem mudanças de tokens.
- Navegação, Pix, promoções e 14 combinações de paleta passaram. Geometria: 48 combinações passaram; gestão: 48 casos passaram. Pagamentos e scanner passaram após as correções, incluindo câmera sintética ativa e fallback.
- Lint global identifica problemas anteriores de formatação em arquivos fora do escopo e prefer-const em previewAuthStorage.ts; esses arquivos não foram alterados nesta edição. Não se declara lint global aprovado.
- FIA-01/S3 (overflow), FIA-02/S1 (cotação antiga), FIA-03/S3 (nome acessível) e FIA-04/S3 (camada da confirmação) reproduzidos e corrigidos; nenhum S1 aberto.

## Rastreabilidade

FR001→T008; FR002→T004/T006; FR003→T007; FR004/005→T007/T009;
FR006→T010/T011/T013; FR007→T003/T004/T011; FR008→T003/T012/T013;
FR009→T003/T005/T015/T017; FR010→T014. SC001/002→T003/T015;
SC003→T015/T016; SC004→T003/T005/T015. Analyze: 14 requisitos/critérios,
17 tarefas, cobertura100%, sem ambiguidades ou duplicações. Constituição1.0.1 esclarece
scanner vigente, sem trocar câmera/plugins. Nenhum segredo, API ou dependência de produção adicionada.

## Reconcile drift

| Regra                       | Evidência                                                            | Decisão                                                                          |
| --------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cinco abas com Início       | index agora usa CustomersPanel; resumo.tsx preserva painel anterior  | Mudança explícita aprovada: Fiados e Resumo em Ajustes, registrada nos contratos |
| Câmera descrita como ML Kit | BarcodeScanner já usa html5-qrcode embutido; plugin nativo permanece | Esclarecimento documental1.0.1; preservar caminho vigente                        |
| PaymentSheet único          | contextTitle e retorno collected, sem outra folha de cobrança        | Mesmo layout/monitor para entrada e recebimento                                  |
| Paleta única                | CSS usa tokens existentes; DESIGN diff sem alteração de valores      | Identidade preservada                                                            |

## Convergência

Primeira revisão apontou camada da confirmação, alvos44px e build APK pendente. T018/T019 corrigem interface com Sheet canônico e controles44px; o teste de cobertura da confirmação falhou antes e passou após correção. T020 acompanha assinatura/publicação. Spec/plan preservados durante converge; nenhuma troca de paleta ou dependência.

## APK e aparelho

Workflow build-layout-test.yml mantém app de teste separado, empacotamento release, chave de teste e verificação apksigner/Java. Resultado e link serão registrados após a compilação.

Verificação física pendente: instalar sobre APK46 sem desinstalar, alternar leitura de produtos e QR de cliente real, conferir troco e notificações reais, testar recebimento parcial/integral. O navegador usa câmera sintética/fallback e bridge sem transação bancária real.
