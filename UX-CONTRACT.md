# Contrato de interface

## Fontes

AGENTS.md: preservar dados, fluxo offline, scanner e atualização Android. Aprovação do usuário em 22/09/2026: aplicar a proposta visual. Implementação existente em useStore.ts: regras de quantidade, venda, estoque e exclusão. A apresentação não cria novas regras de negócio.

## Fluxos

- Abertura: Android 12+ usa splash nativo claro com o logotipo completo ajustado à máscara do sistema; depois, a interface de abertura do app mantém a marca por cerca de quatro segundos na inicialização fria.
- Venda: Início → Caixa → PaymentSheet existente → registro local existente. Diminuir quantidade de 1 remove a linha, conforme changeQty. Câmera montada, leituras não alteram carrinho durante pagamento.
- Estoque: lista → Cadastrar ou produto → Sheet → salvar → lista, mantendo busca/filtro. No cadastro, a câmera abre junto com o editor, permanece aberta após a leitura e termina somente ao fechar o Sheet. Fechar cancela a edição visível; dados persistidos não mudam antes de salvar. Salvamento bloqueia envios simultâneos.
- Excluir: confirmação nomeia produto e consequência; cancelar mantém editor. Exclusão permanece a do store; não adiciona exclusão remota.
- Histórico mantém períodos, relatórios e ações existentes. A exclusão usa AlertDialog, identifica o valor e a data da venda e mantém o registro ao cancelar. Ajustes mantém configuração, tema e verificação manual de atualização; histórico acessível pela navegação.
- Estados vazios comunicam como começar; nenhum dado de demonstração é persistido automaticamente.

## Funcionamento local

O aplicativo operacional não exige autenticação e não envia produtos, vendas ou configurações para a nuvem. Todos esses dados permanecem no armazenamento local. A internet é usada somente para consultar e baixar novas versões; falha ou ausência de conexão não bloqueia nenhuma operação do PDV.

Não há mudança em assinatura ou permissões Android. Conferência em dispositivo e comparação visual são gates pendentes antes da integração final. Reverter a alteração de apresentação não requer migração de dados.

Datas do histórico continuam como input date nativo: seletor e geometria pertencem ao sistema operacional. A auditoria estática detectou também falsos positivos em Button asChild/props e pendências legadas de formulário em códigos e textarea. Nenhuma conformidade global é declarada por esta mudança.

## Canonical UI Map

| Capability | Canonical owner                         | Source of truth             | Allowed variants                  | Verification                     |
| ---------- | --------------------------------------- | --------------------------- | --------------------------------- | -------------------------------- |
| Date       | Input nativo do sistema                 | Este contrato               | date                              | Histórico em Android e navegador |
| Form       | Input, Label, Sheet e validação da rota | Este contrato e useStore.ts | cadastro e edição                 | TypeScript e fluxo manual        |
| Scrollbar  | Estilo global da aplicação              | DESIGN.md e src/styles.css  | geometria de Sheet                | Auditoria estática e navegador   |
| Toast      | Sonner compartilhado                    | Este contrato               | sucesso, informação, aviso e erro | Fluxos de venda e estoque        |
| CRUD       | useStore e rotas de domínio             | AGENTS.md e useStore.ts     | produto e venda                   | TypeScript, build e fluxo manual |
