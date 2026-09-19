# DevMasterIA — Mini Market PDV

Estrutura de desenvolvimento específica do repositório `daily-store-keeper`.

O DevMasterIA não faz parte do APK e não é carregado em runtime. Estes arquivos servem apenas como contexto, processos e checklists para agentes e desenvolvedores.

## Estrutura
- `agents/` — papéis especializados
- `commands/` — fluxos reutilizáveis
- `checklists/` — verificações de qualidade
- `decisions/` — decisões arquiteturais
- `lessons-learned.md` — erros importantes que não devem se repetir

## Princípio
**Planejar → implementar → revisar → verificar → entregar.**

A estrutura foi criada para reduzir regressões sem modificar a aplicação ou o pipeline Android.
