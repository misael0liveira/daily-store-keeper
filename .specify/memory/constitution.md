# Mercadinho União Constitution

## Core Principles

### I. Operação offline e preservação dos dados

PDV, estoque, vendas, gestão e relatórios DEVEM funcionar com os dados locais sem internet.
Migrações DEVEM preservar os registros existentes e ter sua compatibilidade verificada.
Cancelamentos e devoluções DEVEM seguir MANAGEMENT-POLICY.md, mantendo o histórico comercial.
Dados locais NÃO DEVEM ser transferidos para Supabase ou outra nuvem sem decisão explícita
do proprietário. Isso protege a continuidade da operação e o histórico da loja.

### II. Continuidade das funcionalidades e do APK

Mudanças DEVEM preservar funcionalidades existentes fora do escopo solicitado. O scanner
Android DEVE manter o caminho de leitura vigente e a entrada manual existente. Nesta versão,
BarcodeScanner usa html5-qrcode embutido na área aprovada; o plugin ML Kit instalado permanece
preservado. Reutilizar a câmera para identificar clientes NÃO DEVE substituir esse caminho
por outra apresentação nem iniciar duas câmeras simultâneas.
Alterações em Capacitor, Gradle, Manifest, Java/Kotlin, assinatura e permissões DEVEM ser
revisadas antes do build. Atualizações DEVEM manter a compatibilidade da assinatura e da
instalação sobre versões anteriores, para permitir atualizar sem perder dados.

### III. Interface aprovada e ações funcionais

Telas DEVEM seguir DESIGN.md e UX-CONTRACT.md, reutilizando componentes e tokens existentes.
Botões, formulários e navegação DEVEM executar suas ações; renderizar não comprova conclusão.
Valores e estados DEVEM vir dos dados reais da operação. Controles DEVEM respeitar foco,
rolagem, temas e áreas seguras em telas móveis. Cabeçalhos de pagamento DEVEM manter título,
Dividir e fechar separados, conforme a geometria já corrigida e documentada.

### IV. Escopo explícito e implementação mínima

Cada próxima edição do APK DEVE usar Spec Kit para registrar o objetivo, critérios de aceite,
arquivos afetados, riscos e tarefas antes da implementação. O plano DEVE partir do código e
das regras existentes, sem redesenhar o produto inteiro. Implementação DEVE limitar-se ao
escopo autorizado. Dúvidas que alterem comportamento ou dados DEVEM ser esclarecidas;
decisões rotineiras de implementação seguem a autorização e o contexto disponíveis.

### V. Evidência de verificação e privacidade

Fluxos afetados DEVEM ser verificados com a replica-test e os testes existentes pertinentes.
Bugs encontrados DEVEM ser reproduzidos, corrigidos e verificados novamente. Código DEVE
passar pelos checks aplicáveis de TypeScript, lint e build; alterações que afetem o APK
exigem a verificação Android correspondente. Relatórios DEVEM distinguir automação no
navegador, build Android e teste físico no aparelho, sem declarar evidência não obtida.
Senhas, tokens e segredos NÃO DEVEM constar no código, logs, issues ou documentação.

## Restrições do projeto

AGENTS.md continua a fonte principal de contexto do agente. DESIGN.md rege a identidade
visual, UX-CONTRACT.md rege os componentes e MANAGEMENT-POLICY.md rege as operações locais.
A stack existente é React/TypeScript, TanStack, Vite, Tailwind, Zustand e Capacitor/Android.
Trocar arquitetura ou dependências exige justificativa vinculada à mudança solicitada.
O histórico publicado no Git NÃO DEVE ser reescrito, preservando a integração com Lovable.

## Fluxo de desenvolvimento

1. Inspecionar os fluxos existentes e registrar a mudança com `$speckit-specify`.
2. Usar `$speckit-clarify` quando houver ambiguidade relevante; criar o plano com `$speckit-plan`.
3. Decompor o trabalho com `$speckit-tasks` e revisar consistência com `$speckit-analyze`.
4. Implementar com `$speckit-implement`, seguindo as tarefas e os critérios definidos.
5. Verificar os fluxos com replica-test, executar os checks aplicáveis e registrar resultados.
6. Usar `$speckit-converge` para reconciliar especificação, implementação e evidências.
7. Informar o que mudou, o que passou e as limitações de verificação; gerar o APK solicitado
   pelo processo existente quando a edição estiver pronta.

Documentos de especificação, plano e tarefas DEVEM ficar versionados junto do código.
Uma alteração exclusivamente documental exige validação dos documentos e ferramentas
afetados, sem impor um novo build do aplicativo.

## Governance

Esta é a adoção inicial das regras existentes para o Spec Kit, autorizada em 2026-10-08.
Instruções explícitas do proprietário e instruções de maior prioridade orientam o trabalho;
esta constituição não cria etapas adicionais de aprovação. Revisões DEVEM conferir os
princípios aplicáveis e registrar desvios concretos no plano, com justificativa.
Uma mudança de regra DEVE registrar motivo, impacto e atualizar os documentos relacionados.
A versão usa SemVer: MAJOR para remoção ou redefinição incompatível de princípio, MINOR para
novos princípios ou ampliação material, PATCH para esclarecimentos sem mudança de regra.

**Version**: 1.0.1 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-08
