---
name: ponytail
description: >
  Resolver tarefas de programação com a menor mudança completa, reutilizando o
  código existente e evitando complexidade sem necessidade. Usar ao escrever,
  corrigir, refatorar ou revisar o APK Mercadinho União e quando o usuário pedir
  Ponytail, simplicidade, YAGNI ou redução de código. Modo padrão full.
---

# Ponytail

Aplicar a menor solução que resolva completamente o pedido. Usar o modo **full**
por padrão. Preservar validação, tratamento de erros, segurança, acessibilidade,
dados e todos os requisitos autorizados pelo usuário.

## Inspecionar antes de editar

Ler o pedido, as regras do projeto e os arquivos envolvidos. Buscar os chamadores
das funções afetadas e identificar componentes, testes, configurações e migrações
que a alteração precisa alcançar. Corrigir a causa compartilhada do problema.
Não ampliar o escopo com recursos hipotéticos.

## Escolher a menor solução completa

Seguir esta ordem e parar na primeira alternativa que resolva o problema:

1. Verificar se o novo código é necessário para o comportamento solicitado.
2. Reutilizar componentes, funções, serviços e padrões já existentes no projeto.
3. Usar a biblioteca padrão ou recurso da plataforma, respeitando os componentes
   e convenções adotados pelo projeto.
4. Reutilizar uma dependência instalada. Adicionar outra somente com necessidade
   concreta que as alternativas existentes não atendam.
5. Preferir código curto e legível; evitar uma linha que exija decifração.
6. Implementar somente o código adicional necessário.

Evitar abstrações, wrappers, opções, conversões, configurações e código
"para depois" sem uso no pedido atual. Manter as camadas e interfaces existentes.
Ao mover ou unir código, preservar validação e tratamento de erros. Entre opções
de tamanho equivalente, escolher a que trate melhor os casos extremos.
Comentar o motivo quando o código não o mostrar. Se houver um atalho relevante,
documentar seu limite e quando substituí-lo.

## Concluir e verificar

Completar os chamadores, testes e demais arquivos necessários. Executar os checks
pertinentes ao comportamento afetado. Cobrir lógica nova não trivial, especialmente
dinheiro, parsers, migrações ou segurança, com teste significativo ou verificação
equivalente. Não criar testes que apenas repitam a implementação, nem exigir testes
de aplicativo para alterações triviais exclusivamente documentais.

Relatar de forma breve o que mudou, o resultado da verificação e apenas limitações
ou riscos concretos. Não declarar funcionamento no aparelho sem teste físico.

## Integrar ao Mercadinho União

Quando trabalhar nesse projeto, ler `AGENTS.md`, `SPEC-KIT.md` e
`.specify/memory/constitution.md`. Usar as skills `speckit-*` para especificação,
plano e tarefas das edições do APK, e `replica-test` para verificar os fluxos
afetados. Seguir `DESIGN.md`, `UX-CONTRACT.md` e `MANAGEMENT-POLICY.md`.

Manter operação offline, dados locais, funcionalidades existentes, câmera/leitor,
pagamentos e compatibilidade da assinatura Android. Simplicidade não autoriza
reduzir escopo aprovado nem dispensar esses contratos ou a verificação necessária.
Resolver decisões rotineiras usando o contexto e a autorização já fornecidos.
Aplicar as instruções explícitas do usuário e as de maior prioridade em caso de
conflito.

## Modos

- **lite:** implementar o pedido; apresentar uma alternativa menor apenas quando
  ela mudar uma decisão relevante do usuário.
- **full:** aplicar as regras acima. Padrão solicitado para o projeto.
- **ultra:** avaliar também se partes do pedido têm necessidade concreta; não
  remover requisitos aprovados sem nova instrução do usuário.
- **off:** suspender a orientação Ponytail quando o usuário solicitar.

Aceitar pedidos em linguagem natural como "Ponytail lite" ou "desative Ponytail".
Esses modos são instruções de conversa, sem hooks, comandos registrados ou estado
persistente entre sessões. No projeto, `AGENTS.md` estabelece o padrão full.

## Origem e licença

Adaptado para português e para as regras do projeto a partir de
[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), versão 5.1.0,
commit `9cc65d03aa2da1db7121b912d03596409ee340b8`,
arquivo `skills/ponytail/SKILL.md`. Alterações: metadados compatíveis, integração
com Spec Kit e replica-test, verificação proporcional e relato conforme o ambiente.
Preservar o aviso de copyright e a licença MIT incluídos em `LICENSE`.
