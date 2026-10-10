# Mercadinho União — mapa dos fluxos locais

## Gestão local solicitada em 08/10/2026

F06 Dados e estoque: migração v6→v7, identidade fixa, bloqueio de falta, movimentos, contagem, perda e arquivamento.
F07 Devoluções: parcial, total, cancelamento, recompensação única, custo original e comprovante PDF.
F08 Caixa: fundo inicial, suprimento, sangria, despesa dinheiro/Pix, fechamento e diferença.
F09 Recebimentos: fornecedor, caixas×unidades, custo médio, lote, validade e gravação atômica.
F10 Parcelas: dinheiro+Pix/cartão, valor restante no monitor, retomada, devolução e duplicação.
F11 Clientes/fiado: cliente opcional, dívida, vencimento, recebimento parcial sem nova venda.
F12 Atendimento: guardar, retomar, código corrigido, produto arquivado.
F13 Quantidades: kg/l, combos, consumo por componentes, vencidos e perdas.
F14 Backup/CSV: fotos, integridade, prévia, restauração, erros, duplicados e zeros iniciais.
F15 Equipe: proprietário/gerente/caixa, identificação local, PIN incorreto, acesso negado.
F16 Relatórios: mês fechado/30 dias, custos desconhecidos, margem histórica, categorias e perdas.

Todos os testes usam dados sintéticos e o app local. Não testam servidores do OpenSourcePOS nem enviam pagamentos. Matriz comum: vazio, acentos/emoji, duplo envio, erro de armazenamento, Voltar/reload, offline, 320–430px, tema, teclado, nomes acessíveis, console/5xx e axe. Login remoto, Stripe e OAuth não se aplicam. Notificação real, impressora e WebView físico são verificação em aparelho, não presumida a partir do bridge sintético.

Escopo: paleta e dimensões dos pagamentos do APK teste, solicitações de 08/10/2026. Aplicativo próprio existente, não uma cópia de serviço externo. A skill replica-test foi lida em https://github.com/Jakeschincariol/replica-skill/blob/main/replica-test/SKILL.md. Nenhum teste é enviado a bancos ou outros servidores.

| Fluxo                     | Telas e estados                                                                         | Proprietário                                          | Dados                                        |
| ------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| F01 Navegação e aparência | Início, Histórico, Caixa, Estoque, Ajustes, configurações, aviso offline, troca de tema | BottomNavigation, ThemeApplier, Sonner                | useStore/localStorage                        |
| F02 Produtos e promoções  | busca, editor, cancelamento, desconto, validação e datas                                | Estoque, PromotionManager, ProductPhoto, ProductPrice | useStore e IndexedDB                         |
| F03 Pagamentos            | dinheiro, teclado, insuficiência, Pix/QR, débito, crédito, sucesso                      | PaymentSheet, PixQr, PaymentSuccess                   | cotação e venda local; bridge de notificação |
| F04 Aparência Android     | abertura branca, tema persistido, ícones das barras e retorno ao app                    | AppStartup, NativeThemeBars, SystemBars do Capacitor  | preferência local                            |

Dado de teste: Arroz São João, código 123, R$ 4,24, estoque 2. Isolado em cada contexto do navegador. Avisos nativos usam bridge sintética; nenhuma notificação bancária real é presumida.

Autenticação, segundo usuário remoto, senha incorreta, expiração de login, OAuth e cartão Stripe não se aplicam ao PDV local. Ele não processa o cartão; aguarda notificação ou conferência manual. A regra de validade da notificação continua nos testes Java e de pagamentos existentes.

F05 Geometria de pagamentos: logo, quatro abas, card, fechar, campos de dinheiro, QR, maquininha, teclado e rodapé de confirmação. Mesmo proprietário PaymentSheet; tokens --payment-* em src/styles.css. Dados continuam locais. Reproduzir em 320×568, 360×640, 390×844, 414×896 e 430×800, nos dois temas; caso adicional 390×844 com insets simulados de 24px e total de R$ 1.234,56.

F17 Fiados: cadastro, CPF opcional, código estável, busca, limite, extrato e cartão QR.
F18 Compra parcial: identificar cliente, produtos, entrada nos quatro meios, revisão e registro do saldo em aberto.
F19 Receber dívida: valor, alocação, quatro meios, idempotência, recibo e caixa sem nova venda/estoque.

F20 Reposição por giro: janela30dias, devoluções/combos/identidade, parâmetros globais, limite/card, busca, texto/PDF e backup/offline. Proprietário calculateReplenishment/useReplenishment e Estoque; dados locais. F21 Fechar cliente: geometria circular44px, centralização, foco, Escape e carrinho preservado; proprietário customer-sheet/Sheet.

F21: Caixa → Pagamento → um/dois meios → receber → saldo/confirmar; proprietário PaymentSheet.

F22 — Fiado sem redundâncias: cadastro é fonte do vencimento; entrada cobra diretamente e resumo confirma a venda.

F23 — Fiado em um único modal: seleção total/parcial e resumo compartilhados; X/Escape, saldo restante e confirmação explícita. Vender/Sheet/RadioGroup/PaymentSheet; sem mudança no domínio.
