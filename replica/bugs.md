# Bugs reproduzidos — revisão da paleta

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
