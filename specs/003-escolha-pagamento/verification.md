# Verification — escolha de pagamento
Ponytail full: proprietário PaymentSheet e parcelas existentes; nenhuma dependência/schema/nativo novo.
Spec Kit: especificação, pesquisa, plano, modelo, contrato, tarefas e checklist; análise com8FR/3SC e cobertura integral.
replica-test: F21 em replica/recon.md/test-plan.md e e2e/payment-choice.spec.cjs.
Checks locais: TypeScript, ESLint dos componentes alterados,49/49 testes Node, build web, Prettier e git diff --check passaram.
Auditoria premium strict:0unresolved,0violations,0warnings. Sem alterações de tokens.
Escolha:39 casos passaram em320/360/430px, claro/escuro, com validação, Escape/Cancelar/Voltar/foco,
primeira parcela, bloqueio do meio anterior, retomada após refresh, recebimento offline e venda/estoque uma vez.
Regressões de pagamentos e Pix passaram. Demais suítes/pipeline Android em verificação.
Browser local Chromium153 via pacote de ferramenta, sem dependência adicionada ao app. Primeiro ensaio amplo foi interrompido por
rebuild concorrente dos assets; ensaio subsequente identificou limitação de recarga offline no navegador local alternativo.
Pipeline canônico utiliza Chromium Playwright e serve os assets finais sem rebuild.
Limites: notificações/câmera sintéticas, aparelho/instalação física ainda não testados.
