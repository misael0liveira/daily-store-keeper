# Verification

Ponytail full, Spec Kit, frontend-design/premium e replica-test aplicados ao escopo existente.
TypeScript, ESLint dos componentes, 49 testes Node, build web, formatter/diff-check e auditoria premium strict (0 findings) passaram.
Navegador local: compra/recebimento em dinheiro/Pix/débito/crédito e dois meios, 320–430px nos dois temas passaram.
12 cenários adicionais total/parcial/data cadastral/override/cancelamento/valor/limite e 3 de recotação passaram na execução focada.
Inspeção visual: entrada light320 e resumo dark320, controles/valores reais e axe sem violações.
Primeiras execuções locais identificaram shell de preview antigo e limitação de recarga offline do Chromium alternativo.
Preview atualizado para assets finais. Teste de cancelamento corrigido para retornar ao carrinho como o fluxo vigente.
CI 37981524440 confirmou 61 casos Fiados, incluindo recarga offline, além das regressões de navegador anteriores. Reposição interrompeu o workflow por uma corrida no teste de retorno de foco; a espera agora usa a condição real de foco com prazo de 2s e mantém a assertion. Build Android será executado no próximo run.
Build/assinatura Android e APK em preparação. Conferência física não realizada.

Pagamento normal: 39 casos de escolha/validação/retomada passaram, incluindo recebimento offline; suíte payments de teclado/troco/Pix/cartões/monitor/respostas atrasadas/persistência/sucesso de 2s passou em 320/414/430px.
