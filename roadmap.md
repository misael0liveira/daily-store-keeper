# Roadmap

## App Android (Capacitor) — concluído
- [x] Pré-geração das telas em HTML estático (`/`, `/estoque`, `/vendas`, `/vendas/configuracoes`)
- [x] Capacitor instalado e configurado (`capacitor.config.ts`, app.minimarket.pos)
- [x] Pasta `android/` com permissão de câmera/vibração, nome, cores e ícones
- [x] Leitor nativo ML Kit no Android, leitor web mantido no navegador
- [x] Scripts `android:sync`, `android:open`, `android:run`
- [x] `README-ANDROID.md` com passos de APK/AAB no Android Studio
- [x] Build web e prévia verificados (4 telas, sem erros de console)

Pendente do seu lado: gerar o APK/AAB no Android Studio (não é possível compilar aqui).

## Dashboard operacional — concluído
- [x] Início com métricas, gráfico, alertas, últimas vendas e resumo de caixa
- [x] PDV preservado em Vender e navegação com quatro destinos
- [x] Visual verde operacional, Inter e dark mode
- [x] Verificação mobile/desktop e fluxo de venda

## Modo offline-first — concluído
- [x] Cache do app (telas, scripts, estilos, ícones) para abrir sem internet
- [x] Atualização automática e segura, sem travar em versão antiga
- [x] Aviso discreto de Offline/Online com contagem de vendas locais
- [x] Vendas offline com identificador único, data/hora, itens, total e forma de pagamento
- [x] Estoque e dashboard funcionando com os dados do aparelho
- [x] Camada de sincronização isolada (sem servidor: nada é enviado, nada é apagado)
- [x] Cartão "Dados neste aparelho" em Mais
- [x] Teste offline: recarregar, navegar, vender e voltar online sem perder dados
