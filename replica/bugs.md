# Bugs reproduzidos — revisão da paleta

## DIV-01 — Dividir sobrepunha o título do pagamento

- Severidade: S3, corrigido.
- Reprodução: APK45/6338816, abrir pagamento em dinheiro; botão Dividir ocupava a posição absoluta top:12px/left:12px no card. O proprietário confirmou em 100517.jpg.
- Esperado: título, divisão e fechar em áreas distintas; alvos de 44px; editor sem esconder controles ou sair do card.
- Real: Dividir cobria “Pagamento”. Teste de interseção falhou em light-320x568/Dinheiro antes da correção.
- Evidência: F05-E3 em e2e/payment-dimensions.spec.cjs, erro `Dividir overlaps payment title`; capturas após correção em navigation-screenshots/payment-dimensions-*.
- Correção: cabeçalho flexível compartilhado com colunas próprias para título, Dividir e fechar; editor abaixo do cabeçalho, limitado ao card com rolagem. Teclado, rodapé e moldura compartilhada preservados.
- Verificação: 48/48 combinações de geometria e editor aberto nos quatro meios, claro/escuro, 320–430px e áreas seguras; axe e console/5xx sem falhas. Testes de fluxo de pagamento, gestão, unidade, TypeScript/build e lint também executados nesta revisão.
- Commit: `fix(payments): reserve header space for split and close controls`; consultar `git log -1 -- e2e/payment-dimensions.spec.cjs`.

## PAL-01 — filtros do Histórico abaixo do contraste mínimo

- Severidade: S3, corrigido.
- Reprodução: APK42/base ca1836a; tema claro; Histórico; observar Quinzenal, Mensal, Período e Tudo em 320 px.
- Esperado: contraste mínimo 4,5:1 para texto pequeno.
- Real: texto #687180 sobre #f0f3f6, contraste 4,42:1, confirmado por axe.
- Evidência: teste palette-navigation.spec.cjs falhou antes da correção em F01-H1; saída: `Accessibility: light-320 Histórico / color-contrast`.
- Correção: --muted-foreground #596777, contraste 5,19:1 sobre --muted, em src/theme/palette.css; teste mantido.
- Commit: o commit que contém este relatório e a correção; identificar por `git log -1 -- replica/bugs.md`.

## PAL-02 — monitoramento ativo sem a cor de sucesso

- Severidade: S3, corrigido.
- Reprodução: Ajustes → Configurações, bridge de teste com permissão concedida; ler “Monitoramento de notificações ativo”. Repetir em claro/escuro.
- Esperado: ícone e mensagem verdes, com o mesmo papel de sucesso usado no restante do app.
- Real: `text-success` não gerava utility nem possuía --success; mensagem herdava cor neutra. Valores anteriores: rgb(20,27,37) no claro e oklch(0.97 0.005 150) no escuro; --success vazio.
- Evidência: leitura do estilo computado no navegador antes da alteração; regressão permanente verifica token definido e mensagem usando sua cor.
- Correção: token e alias Tailwind de sucesso, compartilhados com preços e status do caixa.
- Commit: o commit que contém este relatório; `git log -1 -- replica/bugs.md`.

## PAL-03 — texto secundário da confirmação na primeira revisão

- Severidade: S3, corrigido antes de publicar.
- Reprodução: primeira implementação local da paleta; confirmar dinheiro; texto “Venda confirmada”.
- Esperado: contraste mínimo 4,5:1.
- Real: acento #c2f3d3 sobre #087b3e dava 4,36:1; axe acusou color-contrast em F03-H3.
- Evidência: palette-payments.spec.cjs falhou em `Accessibility: light-320 confirmação`.
- Correção: separar brilho decorativo do texto; --success-display-text deriva 90% do branco e passa na inspeção axe. Animação de 2s preservada.
- Commit: o commit que contém este relatório; `git log -1 -- replica/bugs.md`.

## Verificação pendente no aparelho

Ícones Android, instalação sobre o APK42 e notificações bancárias reais. Sem bug atribuído a esses itens sem reprodução.

Nenhum S1/S2 reproduzido nesta revisão. Nenhum bug reproduzido permanece aberto.

## DIM-01 — cabeçalho e card mudavam de posição entre meios

- Severidade: S3, corrigido.
- Reprodução: base APK43/aa39ed0, 390×844; abrir pagamento e alternar dinheiro/Pix/débito.
- Esperado: logo, abas e card mantêm posição e dimensões ao trocar o conteúdo interno.
- Real: a altura da marca dependia da distribuição flexível do conteúdo: dinheiro 168,80px, Pix 208,89px, cartão 224,98px. O card começava em y=244,80 / 284,89 / 300,98, deslocamento de até 56,18px.
- Evidência: medidas do baseline de tests/payment-dimensions-browser.cjs; também reproduzido em 430×800, com deslocamento de 36,02px.
- Correção: altura compartilhada da logo e das abas, sem flex-shrink condicionado ao conteúdo; card usa o espaço restante. Regressão compara os quatro meios.
- Commit: o commit desta revisão de dimensões; consultar `git log -1 -- e2e/payment-dimensions.spec.cjs`.

## DIM-02 — ícones comprimidos nas abas de pagamento

- Severidade: S3, corrigido.
- Reprodução: base APK43, 320×568, abrir pagamento e comparar os ícones das quatro abas.
- Esperado: ícones de mesmo tamanho e rótulos completos.
- Real: ícone de dinheiro encolhia no layout horizontal ao competir com o rótulo pela largura.
- Evidência: primeira execução falhou em `light-320x568/Dinheiro: compressed payment icon`; inspeção da geometria do SVG no navegador.
- Correção: ícone não encolhe e o nome fica abaixo do ícone. Teste inspeciona dimensões, alinhamento e limites do rótulo.
- Commit: o commit desta revisão; consultar `git log -1 -- e2e/payment-dimensions.spec.cjs`.

## GES-01 — estoque insuficiente concluía venda e truncava saldo

- Severidade: S1, corrigido.
- Reprodução: baseline c06c46f, cadastrar duas unidades, montar cotação com três e finalizar.
- Esperado: bloquear fechamento, mantendo saldo e carrinho.
- Real: documento era salvo e saldo era limitado a zero.
- Evidência: F06-N1 falhou antes da implementação; regressão agora exige throw, saldo 2 e nenhuma venda.
- Correção: validação de estoque de todos os itens/componentes antes do commit único.
- Commit: commit desta entrega; consultar `git log -1 -- tests/management.test.mjs`.

## GES-02 — exclusão apagava o documento sem compensar estoque

- Severidade: S1, corrigido.
- Reprodução: baseline c06c46f, vender uma das duas unidades e excluir a venda pelo Histórico.
- Esperado: conservar documento cancelado e compensar estoque uma única vez.
- Real: venda sumia do histórico e saldo permanecia reduzido.
- Evidência: F07-H1 falhou antes da implementação; novo teste verifica histórico, status e repetição da operação.
- Correção: cancelamento/devolução compensatórios, limite ao saldo ainda vendido e idempotência.
- Commit: commit desta entrega; consultar `git log -1 -- src/store/useStore.ts`.

## GES-03 — caixa fechado aceitava fechamento de venda

- Severidade: S1, corrigido.
- Reprodução: baseline c06c46f, definir caixa fechado e finalizar carrinho.
- Esperado: solicitar abertura de caixa antes de registrar pagamento/venda.
- Real: documento era concluído sem caixa aberto.
- Evidência: F08-N1 falhou antes da implementação. Unidade e navegador agora verificam o bloqueio.
- Correção: sessão aberta exigida no domínio para pagamento, venda e dinheiro físico.
- Commit: commit desta entrega; consultar `git log -1 -- src/store/useStore.ts`.

## GES-04 — cache tentava buscar páginas já salvas ao entrar offline

- Severidade: S3, corrigido.
- Reprodução: regressão local F01-N1, cache aquecido, desligar rede e verificar atualização.
- Esperado: continuar no app sem pedidos redundantes nem console.error.
- Real: seis recursos retornavam ERR_INTERNET_DISCONNECTED durante o aquecimento de rotas.
- Evidência: palette-browser.cjs falhou no monitor de console durante esta implementação.
- Correção: aquecimento reutiliza resposta já presente e não inicia requisições sem rede.
- Commit: commit desta entrega; consultar `git log -1 -- src/lib/pwa-register.ts`.

Bugs reproduzidos desta entrega: 3 S1 e 1 S3 corrigidos. Nenhum S1/S2 reproduzido permanece aberto. Cenários de câmera/instalação/notificações reais permanecem na lista de conferência física, sem bug atribuído sem reprodução.

## FIA-01 — botão longo criava rolagem lateral após entrada

- Severidade: S3, corrigido.
- Reprodução: 320×740, compra100, receber50 em dinheiro e retornar ao resumo.
- Esperado: resumo e conteúdo do Caixa sem rolagem lateral.
- Real: Registrar devolução das parcelas ultrapassava a coluna; container do toast ultrapassava viewport.
- Evidência: fiados-browser falhou em Horizontal overflow: Resumo da entrada Dinheiro; captura fiados-failure-Dinheiro.png.
- Correção: quebra de linha no ConfirmAction canônico e limite responsivo do Sonner; cabeçalho do cliente reserva espaço para fechar.
- Commit: commit desta edição; consultar git log -1 -- src/components/ManagementUI.tsx.

## FIA-02 — fiado reutilizava cotação de pagamento abandonado

- Severidade: S1, corrigido.
- Reprodução: abrir pagamento da compra100, fechar sem receber, aumentar quantidade para200, receber entrada100 pelo fiado.
- Esperado: dívida100 da compra, saldo anterior80 resulta180; venda200 e estoque8.
- Real: cotação antiga100 ficava congelada na entrada; o resumo não oferecia Registrar venda com fiado.
- Evidência: freshQuote em e2e/fiados.spec.cjs falhou antes da correção (timeout do botão); depois passou com venda200/saldo180/estoque8.
- Correção: usar cotação/txid persistidos somente quando há parcelas recebidas; sem parcelas recotar carrinho atual.
- Commit: commit desta edição; consultar git log -1 -- src/routes/vender.tsx.

## FIA-03 — nome acessível da confirmação divergia do contrato existente

- Severidade: S3, corrigido.
- Reprodução: regressão payments-browser.cjs, pagamento em dinheiro confirmado.
- Esperado: status acessível Pagamento recebido preservado e animação2s.
- Real: nova parametrização incluía exclamação no nome do status, quebrando o contrato semântico anterior.
- Evidência: waitSuccess falhou aguardando o nome anterior.
- Correção: conservar nome acessível anterior; título visível e variante Venda registrada continuam parametrizados.
- Commit: commit desta edição; consultar git log -1 -- src/components/PaymentSuccess.tsx.

Nenhum S1 aberto nesta edição. Scanner real, atualização sobre APK46 e notificações bancárias permanecem na conferência física, sem bug presumido.

## FIA-04 — navegação aparecia por cima da confirmação de fiado

- Severidade: S3, corrigido.
- Reprodução: freshQuote, registrar compra com fiado e inspecionar o ponto inferior da confirmação verde.
- Esperado: confirmação cobre controles de fundo e permanece durante2s.
- Real: PaymentSuccess fora do Sheet não ultrapassava a camada do dock/barra do Caixa.
- Evidência: teste elementFromPoint falhou antes da correção em Confirmação do fiado deve cobrir os controles de fundo.
- Correção: usar Sheet canônico com variante payment-sheet, título/descrição acessíveis e fechamento bloqueado durante sucesso.
- Commit: revisão de convergência desta edição; consultar git log -1 -- src/routes/vender.tsx.

## BUG-REPL-001 — Foco perdido ao fechar seleção de cliente

- Severidade: S3, corrigido.
- Reprodução: abrir Selecionar cliente no Caixa; tocar Fechar; verificar document.activeElement.
- Esperado: retornar ao botão Selecionar cliente sem modificar carrinho/cliente.
- Real: foco não retornava ao controle de origem quando Sheet era montado por estado sem SheetTrigger.
- Evidência: e2e/replenishment.spec.cjs, geometry: assert do foco falhou antes da correção; screenshot replenishment-light-320-cliente.png.
- Correção: SheetContent captura o opener no evento de abertura e restaura foco ao fechar, respeitando overrides existentes. Círculo44px e centro do X são verificados no proprietário customer-sheet.
- Commit: edição de reposição; consultar git log -1 -- src/components/ui/sheet.tsx.

O pedido visual do X foi localizado no print100683.jpg; círculo, alvo e centro são verificados por geometry. Falha inicialmente observada no teste de backup era espera do teste: a modal ocultava o heading antes de completar a operação. Corrigida espera pelo fechamento da modal, sem atribuir bug ao produto.

## Escolha de pagamento — teste 50

Pedido do proprietário: retirar Dividir e apresentar escolha antes da cobrança. Cobertura F21 verifica seleção,
validação, cancelamento, foco, duas parcelas em meios distintos, persistência e conclusão única offline.
Nenhum bug novo do aplicativo reproduzido nesta revisão; limitações iniciais do ambiente de navegador local
foram corrigidas e os cenários correspondentes passaram. Conferência física segue pendente.

Teste 50: workflow 37970695624 concluído com sucesso; todas as suítes de navegador e Android passaram, APK assinado publicado.
