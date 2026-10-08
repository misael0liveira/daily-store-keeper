# Mercadinho União — mapa dos fluxos locais

Escopo: paleta do APK teste, solicitação de 08/10/2026. Aplicativo próprio existente, não uma cópia de serviço externo. A skill replica-test foi lida em https://github.com/Jakeschincariol/replica-skill/blob/main/replica-test/SKILL.md. Nenhum teste é enviado a bancos ou outros servidores.

| Fluxo                     | Telas e estados                                                                         | Proprietário                                          | Dados                                        |
| ------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| F01 Navegação e aparência | Início, Histórico, Caixa, Estoque, Ajustes, configurações, aviso offline, troca de tema | BottomNavigation, ThemeApplier, Sonner                | useStore/localStorage                        |
| F02 Produtos e promoções  | busca, editor, cancelamento, desconto, validação e datas                                | Estoque, PromotionManager, ProductPhoto, ProductPrice | useStore e IndexedDB                         |
| F03 Pagamentos            | dinheiro, teclado, insuficiência, Pix/QR, débito, crédito, sucesso                      | PaymentSheet, PixQr, PaymentSuccess                   | cotação e venda local; bridge de notificação |
| F04 Aparência Android     | abertura branca, tema persistido, ícones das barras e retorno ao app                    | AppStartup, NativeThemeBars, SystemBars do Capacitor  | preferência local                            |

Dado de teste: Arroz São João, código 123, R$ 4,24, estoque 2. Isolado em cada contexto do navegador. Avisos nativos usam bridge sintética; nenhuma notificação bancária real é presumida.

Autenticação, segundo usuário remoto, senha incorreta, expiração de login, OAuth e cartão Stripe não se aplicam ao PDV local. Ele não processa o cartão; aguarda notificação ou conferência manual. A regra de validade da notificação continua nos testes Java e de pagamentos existentes.
