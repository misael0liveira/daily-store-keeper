# Spec Kit no Mercadinho União

Adotado em 08/10/2026 para as próximas edições do APK, por solicitação do proprietário.
Integração oficial Codex do Spec Kit 1.1.2, com scripts Bash e workflow padrão.
Referência: https://github.com/github/spec-kit.

## Começar a próxima edição

Ler AGENTS.md, `.specify/memory/constitution.md`, DESIGN.md, UX-CONTRACT.md e
MANAGEMENT-POLICY.md. Inspecionar o código dos fluxos afetados antes de especificar.

| Etapa | Skill Codex | Resultado |
| --- | --- | --- |
| Especificar | `$speckit-specify` | Objetivo e critérios de aceite da edição solicitada |
| Esclarecer, quando necessário | `$speckit-clarify` | Resolver ambiguidades relevantes |
| Planejar | `$speckit-plan` | Arquivos, abordagem, compatibilidade e riscos |
| Decompor | `$speckit-tasks` | Tarefas executáveis do escopo |
| Revisar consistência | `$speckit-analyze` | Conferir especificação, plano e tarefas |
| Implementar | `$speckit-implement` | Executar as tarefas e atualizar seu progresso |
| Verificar | `replica-test` e testes existentes | Evidências funcionais e regressões corrigidas |
| Reconciliar | `$speckit-converge` | Documentos coerentes com o código e resultados |

As skills gerenciam os documentos da mudança em `specs/`. Versionar esses documentos
junto do código. Manter a implementação proporcional ao pedido; não reconstruir
retroativamente toda a documentação do aplicativo. Para bugs, registrar reprodução,
resultado esperado e regressões a verificar na especificação da correção.

A `replica-test` é uma skill separada: o Spec Kit não a instala. Usar a skill disponível
no ambiente e os planos em `replica/`, com os testes pertinentes de `tests/` e `e2e/`.
Se a skill não estiver disponível, localizar sua instalação antes de executar esse passo
e relatar a indisponibilidade se ela não puder ser recuperada.

Após os checks aplicáveis, seguir o processo existente de build e entrega do APK teste.
Separar evidência de navegador, compilação Android e validação física no aparelho.

## Arquivos instalados

- `.agents/skills/speckit-*`: instruções das skills oficiais para Codex.
- `.specify/scripts/`, `templates/` e `workflows/`: infraestrutura oficial.
- `.specify/memory/constitution.md`: regras do projeto, versão inicial 1.0.0.
- `.specify/integration.json`: integração instalada e versão da ferramenta.

## Verificar a instalação

Com `uv` disponível, executar na raiz do repositório:

```sh
uvx --from specify-cli==1.1.2 specify integration status --json
```

A integração deve indicar `codex` instalado e arquivos gerenciados sem alterações
inesperadas. Revisões de regras são feitas com `$speckit-constitution`; atualizações
da ferramenta devem manter as regras locais e registrar sua versão.
