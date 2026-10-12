# Validation

1. tsc --noEmit; node --test tests/*.test.mjs; build web.
2. Servir preview, verificar navegação/teclas/claro/escuro/overflow e scanner expandido, inclusive negado.
3. Rodar suites fiados, pagamentos, Pix, reposição, promoções e gestão; screenshots e axe.
4. Workflow de teste: Gradle unit/assembleRelease, apksigner, chave em cache e release separada.
5. No aparelho: instalar sobre teste anterior, conferir dados, scanner/lanterna, teclado, notificações e safe areas.
