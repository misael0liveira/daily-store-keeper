# Contrato de interface

## Fontes
AGENTS.md: preservar dados, fluxo offline, scanner e atualização Android. Aprovação do usuário em 22/09/2026: aplicar a proposta visual. Implementação existente em useStore.ts: regras de quantidade, venda, estoque e exclusão. A apresentação não cria novas regras de negócio.

## Fluxos
- Venda: Início → Caixa → PaymentSheet existente → registro local existente. Diminuir quantidade de 1 remove a linha, conforme changeQty. Câmera montada, leituras não alteram carrinho durante pagamento.
- Estoque: lista → Cadastrar ou produto → Sheet → salvar → lista, mantendo busca/filtro. Fechar cancela a edição visível; dados persistidos não mudam antes de salvar. Salvamento bloqueia envios simultâneos.
- Excluir: confirmação nomeia produto e consequência; cancelar mantém editor. Exclusão permanece a do store; não adiciona exclusão remota.
- Histórico mantém períodos, relatórios e ações existentes. Ajustes mantém configuração, tema e sincronização; histórico acessível pela navegação.
- Estados vazios comunicam como começar; nenhum dado de demonstração é persistido automaticamente.

## Limites da revisão
Sem mudança em autenticação, licenças, backend, assinatura ou permissões Android. Conferência em dispositivo e comparação visual são gates pendentes antes da integração final. Reverter a alteração de apresentação não requer migração de dados.

Datas do histórico continuam como input date nativo: seletor e geometria pertencem ao sistema operacional. A auditoria estática detectou também falsos positivos em Button asChild/props e pendências legadas de formulário em códigos e textarea. Nenhuma conformidade global é declarada por esta mudança.
