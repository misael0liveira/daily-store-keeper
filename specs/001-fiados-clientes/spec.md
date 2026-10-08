# Feature Specification: Fiados e pagamentos de clientes

**Feature Branch**: `feat/fiados-clientes` | **Created**: 2026-10-08 | **Status**: Approved
**Input**: Aprovação do proprietário da proposta e dos fluxos explicados nesta conversa.

## User Scenarios & Testing

### User Story 1 — Cadastro e consulta (Priority: P1)

Como lojista quero a aba Fiados na posição de Início, buscar clientes, consultar saldo e extrato,
cadastrar/editar e gerar cartão QR. O resumo anterior permanece acessível em Ajustes.
**Independent Test**: cadastrar, localizar por nome/código/telefone/CPF, editar e conferir o mesmo cartão.
**Acceptance Scenarios**: cadastro sem CPF funciona; CPF inválido/duplicado é recusado;
clientes antigos conservam dívidas; filtros mostram com saldo, vencidos e todos; nomes iguais não
selecionam automaticamente; cadastro arquivado mantém histórico e pode receber quitação.

### User Story 2 — Venda com entrada e fiado (Priority: P1)

Como caixa quero identificar o cliente por busca ou QR, ler produtos, receber uma entrada por
Dinheiro/Pix/Débito/Crédito e registrar explicitamente o restante no fiado.
**Independent Test**: compra 100, pagamento 50, saldo anterior 80 resulta em dívida 130.
**Acceptance Scenarios**: QR de cliente não entra como produto; carrinho persiste ao selecionar;
Pix cobra apenas a entrada; pagamentos mistos somam entrada; zero de entrada permite fiado integral;
fechar/reabrir não perde parcelas; limite bloqueia nova dívida acima do autorizado; cliente e vencimento
são obrigatórios; estoque baixa uma vez e sucesso mostra saldo em aberto, sem afirmar quitação.

### User Story 3 — Receber dívida (Priority: P1)

Como operador autorizado quero Receber → valor parcial/integral → mesmas quatro abas de pagamento,
com registro no extrato e no caixa sem nova venda ou movimento de estoque.
**Independent Test**: dívida 130, receber 50 resulta em 80, preservando vendas e quantidades.
**Acceptance Scenarios**: valor maior que saldo/zero/negativo recusado; campo vazio usa o saldo disponível; abatimento mais antigo ou
compra específica; dupla confirmação não duplica; quitados continuam no histórico; falha de storage
não indica sucesso e mantém saldo; caixa fechado e operador sem permissão são bloqueados.

## Requirements

- **FR-001**: Manter cinco destinos; Fiados substitui Início e o resumo permanece em Ajustes.
- **FR-002**: Cadastro exige nome, gera código estável e único, admite contato/CPF opcionais,
  habilitação de fiado, limite opcional e dia habitual de vencimento opcional.
- **FR-003**: Buscar nome sem distinguir acento/maiúsculas, código, CPF e telefone;
  CPF mascarado na lista; busca não aparece em endereço, logs ou notificações.
- **FR-004**: QR do cartão identifica somente o cliente local; identificação exige conferência.
- **FR-005**: Reutilizar a câmera existente com modos cliente/produto sem duas câmeras simultâneas.
- **FR-006**: Entrada e recebimento de fiado reutilizam quatro meios, teclado, QR Pix,
  notificações e confirmação manual existentes; cobram somente o valor esperado.
- **FR-007**: Dívida soma apenas saldo não recebido da nova compra; venda/estoque/caixa gravam uma vez.
- **FR-008**: Recebimento é idempotente, atômico e mantém documentos originais e histórico quitado.
- **FR-009**: Preservar backup/restauração, clientes e dívidas da versão anterior, permissões,
  funcionamento offline, assinatura e instalação do APK teste.
- **FR-010**: Gerar comprovante não fiscal da compra e recibo do pagamento da dívida.

### Key Entities

Cliente com identificação e regras de crédito; compra com itens/pagamentos;
dívida com vencimento/saldo; recebimento com meio, data e abatimentos.

## Success Criteria

- **SC-001**: Todas as combinações dos quatro meios registram o valor esperado e conservam o saldo.
- **SC-002**: A mesma confirmação não gera mais de um recebimento, uma venda ou uma baixa de estoque.
- **SC-003**: Os fluxos funcionam sem rede em 320, 360 e 430px nos dois temas, sem controles sobrepostos.
- **SC-004**: Atualização e backup conservam 100% dos clientes/dívidas das amostras anteriores.

## Assumptions

Clientes antigos mantêm autorização anterior de fiado, sem limite inventado; novos exigem habilitação.
Sem limite preenchido não há teto configurado. Atraso mostra aviso, sem bloqueio adicional automático.
Datas usam calendário local; permissão sell cadastra/seleciona, cash recebe; alterar crédito exige manage.
QR funciona localmente; não é senha nem consulta externa de CPF. Bancos e câmera físicos exigem aparelho.
