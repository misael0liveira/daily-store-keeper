# Verification — escolha de pagamento

Ponytail full: proprietário PaymentSheet e parcelas existentes; nenhuma dependência/schema/nativo novo.
Spec Kit: especificação, pesquisa, plano, modelo, contrato, tarefas e checklist; análise com 8 FR/3 SC e cobertura integral.
replica-test: F21 em replica/recon.md/test-plan.md e e2e/payment-choice.spec.cjs.
Checks locais: TypeScript, ESLint dos componentes alterados, 49/49 testes Node, build web, Prettier e git diff --check passaram.
Auditoria premium strict: 0 unresolved, 0 violations, 0 warnings. Sem alterações de tokens.
Escolha: 39 casos passaram em 320/360/430px, claro/escuro, com validação, Escape/Cancelar/Voltar/foco,
primeira parcela, bloqueio do meio anterior, retomada após refresh, recebimento offline e venda/estoque uma vez.
Regressões de pagamentos, Pix, Fiados (49), Gestão (48), dimensões (48), paleta (14), scanner, promoções, navegação e reposição (42) passaram.
Pipeline Android concluído com sucesso: TypeScript/49 testes Node, build web, todas as suítes de navegador (incluindo 39 casos de escolha), testes Android e assembleRelease. Assinatura verificada e release teste 50 publicado. Build fonte: 782602e4d41ac6dbd01c1ff9f19584f39eadad68; run 37970695624, teste 50.
Browser local Chromium153 via pacote de ferramenta, sem dependência adicionada ao app. Ensaios iniciais identificaram
rebuild concorrente de assets e flags do navegador alternativo; reexecução com assets finais e flags corrigidas passou.
A primeira execução da geometria de reposição teve uma falha transitória na leitura de foco após fechar; a suíte inteira passou na reexecução sem mudanças no app.
Pipeline canônico utiliza Chromium Playwright e serve os assets finais sem rebuild.
Limites: notificações/câmera sintéticas, aparelho/instalação física ainda não testados.

APK: https://github.com/misael0liveira/daily-store-keeper/releases/download/layout-test-50/Mercadinho-Uniao-Teste.apk
SHA-256: 064dbc83625d3e334601dbb39cea036088f9de85e86f3f2e6a5176ffcaddf0b5
Workflow: https://github.com/misael0liveira/daily-store-keeper/actions/runs/37970695624
Convergência: 8 FR, 3 SC, 5 critérios de aceite, 3 decisões técnicas e 5 princípios; nenhum gap restante.
