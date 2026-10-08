# Plano replica-test — Fiados

Somente aplicativo local próprio e dados sintéticos; nenhuma cobrança bancária ou consulta de CPF externa.

| Caso      | Caminho feliz                                         | Arestas/negativos e evidência                                                                                                                                                                          |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F17-H1    | Cadastro, editar, nome/código/telefone/CPF, cartão QR | F17-E1 acentos; F17-E2 nome igual/código estável; F17-E3 legado/backup; F17-N1 CPF inválido/duplicado; F17-N2 sem permissão; unidade e navegador                                                       |
| F18-H1    | Compra100, entrada50, dívida antiga80: saldo130       | F18-E1 quatro meios; F18-E2 entrada zero; F18-E3 fechar/reabrir com parcela persistida; F18-E4 QR não adiciona produto; F18-N1 limite/cliente desabilitado/data inválida; unidade e navegador          |
| F19-H1    | Receber50 de130: saldo80, vendas/estoque iguais       | F19-E1 mais antigo/compra específica; F19-E2 quitação/dívida arquivada; F19-E3 duplo envio; F19-E4 falha de storage; F19-N1 excesso/zero/negativo; F19-N2 caixa fechado/permissão; unidade e navegador |
| F17–19-E5 | Claro/escuro, 320–430px, offline/reload               | Playwright/axe, console/5xx, sem overflow, nomes acessíveis e foco nativo                                                                                                                              |

Listas vazias/sem resultados, busca limpa e formulário preservado em erro são verificados na interface. Duas abas/revisão stale e rollback seguem as regressões de gestão. Datas usam calendário local; vencimento não depende de UTC. Login remoto, segundo usuário de nuvem, OAuth e Stripe não se aplicam; permissões locais são conferidas pelo domínio.

Conferência física pendente: instalar sobre APK46 sem desinstalar; ler produto e cartão QR real alternando câmera; conferir dinheiro/troco e notificações reais das quatro formas; recolher entrada e quitar dívida com comprovante. Automação não substitui recebimento real.
