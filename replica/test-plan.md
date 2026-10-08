# Plano de testes — replica-test / paleta

Cada spec usa nomes acessíveis, falha em console.error/pageerror/HTTP 5xx e executa axe WCAG A/AA em cada estado de tela. Servidor local oferece fallback apenas para rotas conhecidas, como o Capacitor; arquivos ausentes continuam retornando 404.

| Caso   | Caminho e resultado esperado                                                                       | Verificação                                          |
| ------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| F01-H1 | Cinco abas exibem dados e ações, sem mudança de geometria; cores legíveis                          | palette-navigation.spec.cjs + navigation-browser.cjs |
| F01-H2 | Configurações mostram monitoramento ativo em verde e QR legível                                    | palette-navigation.spec.cjs                          |
| F01-E1 | Claro/escuro em 320 e 430 px, nenhum overflow                                                      | Todos os specs de paleta                             |
| F01-E2 | Trocar tema pelo teclado e recarregar preserva a escolha                                           | palette-navigation.spec.cjs                          |
| F01-N1 | Sem internet, verificar atualização mostra aviso âmbar e operação continua                         | palette-navigation.spec.cjs                          |
| F02-H1 | Buscar nome com acentos, abrir editor e manter labels e cores                                      | palette-stock.spec.cjs                               |
| F02-E1 | Editar nome com acentos/emoji e cancelar por Escape preserva produto                               | palette-stock.spec.cjs                               |
| F02-N1 | Desconto vazio mostra erro vermelho, sem persistir promoção                                        | palette-stock.spec.cjs                               |
| F02-H2 | Desconto válido mostra preço verde; cancelar não altera os dados                                   | palette-stock.spec.cjs                               |
| F02-E2 | Fotos brancas nos dois temas; descontos por datas/estoque e lotes atômicos                         | promotions-browser.cjs e pdv-regressions.test.mjs    |
| F03-H1 | Os quatro meios mantêm seleção azul, QR Pix branco em ambos os temas e cartão azul; todos legíveis | palette-payments.spec.cjs                            |
| F03-H2 | PAGO possui texto legível em todos os extremos do gradiente verde                                  | palette-payments.spec.cjs                            |
| F03-N1 | Valor insuficiente deixa PAGO desabilitado e exibe falta em vermelho                               | palette-payments.spec.cjs + payments-browser.cjs     |
| F03-H3 | Sucesso legível, venda persistida antes da animação; fechamento em 2s                              | palette-payments.spec.cjs + payments-browser.cjs     |
| F03-E1 | Offline frio, códigos Pix distintos em vendas iguais e mesma referência durante troca de meio      | pix-browser.cjs + payments-browser.cjs               |
| F03-N2 | Valor/horário/sessão/meio divergentes e respostas atrasadas não confirmam                          | payments-browser.cjs + testes Java                   |
| F03-E2 | Escape, repetição de confirmação, celular 320×568, troco e teclado fixo                            | payments-browser.cjs                                 |
| F04-H1 | Abertura branca por 2s; ícones do sistema acompanham tema após abertura e retorno                  | palette-native.spec.cjs + promotions-browser.cjs     |

Limites: validar fisicamente foco da câmera, lanterna, teclado do Android, ícones das barras e instalação por cima do APK42 exige aparelho. Compatibilidade com notificações reais dos quatro adquirentes também exige recebimento real no aparelho. Esses itens não foram substituídos por mocks.

Entradas muito longas, duas abas concorrentes, fuso/DST e outra conta não tiveram regras alteradas pela paleta. Os testes existentes de promoções verificam limites de datas e persistência; não se declara cobertura global dessas condições nesta revisão visual.

## Resultado da revisão

- Paleta: 14 combinações de fluxo/tema/largura aprovadas, 0 falhas finais; 74 inspeções axe nas telas e estados, sem violações WCAG A/AA detectadas, sem console.error/pageerror/5xx.
- Unidade: 18 testes aprovados, 0 falhas.
- Auditoria estática frontend-design-premium: 0 erros, 0 avisos, 0 pendências.
- Três bugs S3 reproduzidos e corrigidos nesta revisão; nenhum S1/S2/S3/S4 reproduzido permanece aberto.
- Conferência visual local dos temas e meios de pagamento realizada pelas capturas do navegador; aparelho físico não disponível.
- Evidências de navegador são geradas em navigation-screenshots e anexadas ao workflow do APK; não são dados do usuário.

## F05 — dimensões dos pagamentos

Regressão F05-E3 (APK45, screenshot 100517.jpg): Dividir não intersecta título, fechar ou QR nos quatro meios; alvo mínimo de 44px. Abrir pelo teclado, editar valor e fechar o editor não desloca o cabeçalho. Editor fica dentro do card e abaixo dos controles; axe inspeciona também o estado aberto. Cobertura acrescentada a payment-dimensions.spec.cjs para a matriz existente de 48 combinações, inclusive áreas seguras e valores grandes.

| Caso   | Caminho e resultado esperado                                                                                      | Verificação                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| F05-H1 | Trocar Dinheiro → Pix → Débito → Crédito: logo, abas, card e fechar conservam x/y/largura/altura                  | payment-dimensions.spec.cjs                        |
| F05-E1 | Cinco tamanhos 320–430px, claro/escuro: ícones 18×18 centralizados, rótulos sem corte e abas de pelo menos 44px   | payment-dimensions-browser.cjs                     |
| F05-H2 | Total/recebido/troco compartilham coluna; resumo não se sobrepõe ao teclado e PAGO fica visível                   | payment-dimensions.spec.cjs + payments-browser.cjs |
| F05-H3 | Pix mantém QR quadrado sem sobreposição de fechar; confirmação manual de Pix/cartão visível, expandível e focável | payment-dimensions.spec.cjs                        |
| F05-E2 | Insets simulados de 24px e R$ 1.234,56 em ambos os temas: geometria e controles continuam acessíveis              | payment-dimensions-browser.cjs                     |
| F05-R1 | Venda, troco, Pix único, notificações conservadoras, persistência offline e sucesso de 2s preservados             | testes de unidade, Pix e pagamentos anteriores     |

Capturas do baseline demonstraram deslocamentos ao trocar de meio. Os testes definitivos verificam a geometria, os nomes acessíveis, axe e erros de console/5xx. O teste falhou antes da correção por ícone comprimido em 320×568. Teste físico em Android permanece pendente; não atribuir bug ao aparelho sem reprodução.

Resultado F05: 48 combinações de meio/tema/dimensões aprovadas, incluindo insets simulados e valor ampliado; 48 inspeções axe adicionais sem violações A/AA, sem console.error/pageerror/5xx. Os seis testes de navegador anteriores, as 14 combinações de paleta, os 18 testes de unidade, TypeScript, lint do componente e build web passaram. Auditoria estática estrita: zero erros/avisos. Dois bugs S3 de geometria reproduzidos e corrigidos; nenhum bug reproduzido permanece aberto. Capturas locais de dinheiro/Pix/cartão nos extremos foram conferidas visualmente. Validação física continua pendente.

## Gestão local — aplicação OpenSourcePOS, 08/10/2026

| Caso   | Resultado esperado                                                        | Teste                                               |
| ------ | ------------------------------------------------------------------------- | --------------------------------------------------- |
| F06-N1 | Falta de estoque bloqueia venda sem alterar saldo/documentos              | management.test.mjs                                 |
| F06-H1 | Perda/contagem exige motivo e registra antes/depois                       | management-inventory.spec.cjs                       |
| F06-E1 | Revisão de outra aba impede sobrescrita e reidrata                        | management.test.mjs                                 |
| F06-E2 | Falha de gravação desfaz recebimento inteiro em memória e disco           | management.test.mjs                                 |
| F06-E3 | Custo digitado 7,50 permanece editável e salva 7.5                        | management-inventory.spec.cjs                       |
| F07-H1 | Cancelar preserva documento, recompõe apenas saldo não devolvido          | management.test.mjs + management-payments.spec.cjs  |
| F07-E1 | Devolução parcial preserva custo original, limite e idempotência          | management.test.mjs                                 |
| F07-E2 | Devoluções em gramas somam exatamente o valor arredondado da venda        | management.test.mjs                                 |
| F08-H1 | Abertura, suprimento, retirada, despesa e diferença de fechamento         | management-cash.spec.cjs + management.test.mjs      |
| F08-N1 | Caixa fechado bloqueia venda, sem perda de carrinho                       | management-cash.spec.cjs + management.test.mjs      |
| F09-H1 | Caixas×unidades, custo médio, lote e movimento únicos                     | management-inventory.spec.cjs + management.test.mjs |
| F09-E1 | Duplo clique/mesmo id não duplica recebimento                             | management-inventory.spec.cjs + management.test.mjs |
| F09-N1 | Linha inválida impede todas as linhas                                     | management.test.mjs                                 |
| F10-H1 | Dinheiro + Pix, saldo correto, cotação persistida e baixa única           | management-payments.spec.cjs + management.test.mjs  |
| F10-E1 | Fechar/recarregar mantém parcela; só saldo integral exibe sucesso         | management-payments.spec.cjs                        |
| F10-E2 | Promoção de 100% conclui venda de total zero                              | management.test.mjs                                 |
| F11-H1 | Fiado e recebimento parcial não duplicam receita; retorno reduz dívida    | management.test.mjs                                 |
| F11-N1 | PIN errado e caixa sem permissão não acessam backup                       | management-team.spec.cjs                            |
| F11-N2 | Código reservado e fração de componente em unidades são rejeitados        | management.test.mjs                                 |
| F12-H1 | Suspensão e troca de código preservam id e carrinho guardado              | management.test.mjs                                 |
| F13-H1 | Kg/l e combos baixam componentes exatos; lote vencido é bloqueado         | management.test.mjs                                 |
| F14-H1 | Exportação/preview/restauração com foto em IndexedDB, sem equipe portátil | management-data.spec.cjs                            |
| F14-E1 | CSV preserva zeros iniciais e dados de custo/estoque                      | management-data.spec.cjs                            |
| F14-N1 | CSV duplicado e checksum adulterado não alteram dados                     | management-data.spec.cjs                            |
| F15-H1 | Proprietário/caixa, identificação local e verificador sem PIN em texto    | management-team.spec.cjs                            |
| F16-E1 | Dez telas em 320×568 nos dois temas sem overflow/violações axe            | management-browser.cjs                              |

Matriz comum aplicada: vazio/erro, nomes com acento e emoji, duplo envio, reload, duas abas concorrentes, armazenamento indisponível, acessibilidade, viewport pequeno e dois temas. As regressões antigas cobrem offline, teclado, notificações sintéticas por sessão/valor, câmeras e confirmação de 2s. O teste de CSV verifica o arquivo inteiro antes de salvar; teste de fotos compara bytes antes/depois da restauração e exige nova chave local.

Verificação manual disponível: inspeção das capturas da Gestão clara, caixa escuro e estados de pagamento/estoque. Limites mantidos: instalação Android, recebimentos bancários reais, lanterna/foco físico e impressão no aparelho. Não se declara sincronização remota, estorno bancário, emissão fiscal ou impressão Bluetooth.

Resultados: 48/48 cenários novos de navegador, 14/14 combinações de paleta, 48/48 combinações de geometria, mais navegação, Pix, pagamentos, scanner e promoções aprovados. Evidências em management-browser-results.json e no workflow do APK. Unidade: 34/34; TypeScript e lint dos arquivos alterados sem erros/avisos; build web aprovado; auditoria estrita 0 erros/avisos; DESIGN.md lint 0 erros/avisos.
