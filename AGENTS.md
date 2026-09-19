<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# DevMasterIA — regras do Mini Market PDV

Este arquivo é a fonte principal de contexto para agentes de desenvolvimento.

## Objetivo
Manter o Mini Market PDV estável enquanto novas funcionalidades são planejadas, implementadas, revisadas e verificadas.

O aplicativo é um PDV/ERP mobile para operação de um mini mercado. O foco é loja, caixa, produtos, estoque, vendas, financeiro, relatórios, configurações e recursos administrativos.

## Regras obrigatórias
1. Não alterar o comportamento do APK sem necessidade.
2. Nunca considerar uma interface pronta apenas porque ela renderiza. Todo botão, link, scanner, formulário e ação importante deve possuir comportamento funcional.
3. Preservar dados locais. Migrações devem preservar dados existentes sempre que possível.
4. Offline first. Operações de PDV, estoque e vendas devem continuar funcionando sem internet, salvo recursos explicitamente remotos.
5. Scanner é funcionalidade crítica. No Android, priorizar o fluxo nativo já existente com ML Kit e manter entrada manual como fallback.
6. Não remover uma funcionalidade existente para implementar outra.
7. Não expor segredos. Nunca gravar senhas, tokens privados, service-role keys ou secrets no código, logs, issues ou documentação.
8. Supabase deve ser tratado como serviço remoto quando aplicável; não mover dados locais para a nuvem sem decisão explícita.
9. Alterações em Gradle, Manifest, Java/Kotlin, plugins Capacitor, assinatura ou permissões Android devem ser revisadas antes do build.
10. O mecanismo atual de atualização do APK deve continuar compatível com o APK assinado e com instalações sobre versões anteriores.

## Stack atual
- React + TypeScript
- TanStack Start/Router
- Vite
- Tailwind CSS
- Zustand
- Capacitor 8
- Android
- ML Kit Barcode Scanning
- Capacitor Biometric Auth
- Supabase
- GitHub Actions
- Bun no workflow Android

## Processo DevMasterIA
### 1. Inspect
Entender arquivos e fluxos existentes antes de editar.

### 2. Plan
Definir arquivos afetados, riscos e critérios de aceite.

### 3. Implement
Fazer a menor alteração necessária, seguindo os padrões existentes.

### 4. Review
Procurar botões sem ação, rotas quebradas, estados impossíveis, regressões, duplicação, problemas de segurança e perda de dados.

### 5. Verify
Executar TypeScript/build, lint/testes quando disponíveis e build Android quando a mudança afetar o APK.

### 6. Report
Informar o que mudou, o que foi verificado e o que não pôde ser verificado.

## Critérios de conclusão
Uma tarefa só deve ser considerada concluída quando o código compila quando aplicável, as ações afetadas têm comportamento funcional, não há regressão evidente, dados locais não foram descartados e mudanças Android foram verificadas quando aplicável.

Consulte `.devmasteria/` para checklists e agentes especializados.
