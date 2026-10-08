# Plano de testes — replica-test / paleta

Cada spec usa nomes acessíveis, falha em console.error/pageerror/HTTP 5xx e executa axe WCAG A/AA em cada estado de tela. Servidor local oferece fallback apenas para rotas conhecidas, como o Capacitor; arquivos ausentes continuam retornando 404.

| Caso   | Caminho e resultado esperado                                                                  | Verificação                                          |
| ------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| F01-H1 | Cinco abas exibem dados e ações, sem mudança de geometria; cores legíveis                     | palette-navigation.spec.cjs + navigation-browser.cjs |
| F01-H2 | Configurações mostram monitoramento ativo em verde e QR legível                               | palette-navigation.spec.cjs                          |
| F01-E1 | Claro/escuro em 320 e 430 px, nenhum overflow                                                 | Todos os specs de paleta                             |
| F01-E2 | Trocar tema pelo teclado e recarregar preserva a escolha                                      | palette-navigation.spec.cjs                          |
| F01-N1 | Sem internet, verificar atualização mostra aviso âmbar e operação continua                    | palette-navigation.spec.cjs                          |
| F02-H1 | Buscar nome com acentos, abrir editor e manter labels e cores                                 | palette-stock.spec.cjs                               |
| F02-E1 | Editar nome com acentos/emoji e cancelar por Escape preserva produto                          | palette-stock.spec.cjs                               |
| F02-N1 | Desconto vazio mostra erro vermelho, sem persistir promoção                                   | palette-stock.spec.cjs                               |
| F02-H2 | Desconto válido mostra preço verde; cancelar não altera os dados                              | palette-stock.spec.cjs                               |
| F02-E2 | Fotos brancas nos dois temas; descontos por datas/estoque e lotes atômicos                    | promotions-browser.cjs e pdv-regressions.test.mjs    |
| F03-H1 | Os quatro meios mantêm seleção azul, QR Pix branco em ambos os temas e cartão azul; todos legíveis                 | palette-payments.spec.cjs                            |
| F03-H2 | PAGO possui texto legível em todos os extremos do gradiente verde                             | palette-payments.spec.cjs                            |
| F03-N1 | Valor insuficiente deixa PAGO desabilitado e exibe falta em vermelho                          | palette-payments.spec.cjs + payments-browser.cjs     |
| F03-H3 | Sucesso legível, venda persistida antes da animação; fechamento em 2s                         | palette-payments.spec.cjs + payments-browser.cjs     |
| F03-E1 | Offline frio, códigos Pix distintos em vendas iguais e mesma referência durante troca de meio | pix-browser.cjs + payments-browser.cjs               |
| F03-N2 | Valor/horário/sessão/meio divergentes e respostas atrasadas não confirmam                     | payments-browser.cjs + testes Java                   |
| F03-E2 | Escape, repetição de confirmação, celular 320×568, troco e teclado fixo                       | payments-browser.cjs                                 |
| F04-H1 | Abertura branca por 2s; ícones do sistema acompanham tema após abertura e retorno             | palette-native.spec.cjs + promotions-browser.cjs     |

Limites: validar fisicamente foco da câmera, lanterna, teclado do Android, ícones das barras e instalação por cima do APK42 exige aparelho. Compatibilidade com notificações reais dos quatro adquirentes também exige recebimento real no aparelho. Esses itens não foram substituídos por mocks.

Entradas muito longas, duas abas concorrentes, fuso/DST e outra conta não tiveram regras alteradas pela paleta. Os testes existentes de promoções verificam limites de datas e persistência; não se declara cobertura global dessas condições nesta revisão visual.

## Resultado da revisão

- Paleta: 14 combinações de fluxo/tema/largura aprovadas, 0 falhas finais; 74 inspeções axe nas telas e estados, sem violações WCAG A/AA detectadas, sem console.error/pageerror/5xx.
- Unidade: 18 testes aprovados, 0 falhas.
- Auditoria estática frontend-design-premium: 0 erros, 0 avisos, 0 pendências.
- Três bugs S3 reproduzidos e corrigidos nesta revisão; nenhum S1/S2/S3/S4 reproduzido permanece aberto.
- Conferência visual local dos temas e meios de pagamento realizada pelas capturas do navegador; aparelho físico não disponível.
- Evidências de navegador são geradas em navigation-screenshots e anexadas ao workflow do APK; não são dados do usuário.
