# Feature Specification: Reposição local e fechamento de cliente

**Feature Branch**: `feat/estoque-reposicao`
**Created**: 2026-10-09
**Status**: Ready for implementation
**Input**: Pedido do proprietário: estoque baixo por venda média dos últimos 30 dias, ciclo de atacado e segurança; sugestão/exportação dos itens visíveis; botão X arredondado e centralizado no seletor de cliente.

## User Scenarios & Testing

### User Story 1 - Planejar a ida ao atacado (Priority: P1)

O lojista configura o intervalo entre viagens e os dias de segurança. Em Estoque baixo, vê quais produtos atingiram o limite e quanto comprar.
**Why this priority**: Reduzir falta e excesso de mercadoria sem internet.
**Independent Test**: 300 unidades líquidas vendidas/30 dias, DC7, MS2, estoque20: mínimo20, alvo90, compra70; estoque21 fica fora.
**Acceptance Scenarios**:

1. **Given** o exemplo acima, **When** ativar Estoque baixo, **Then** aparecer o produto com sugestão70.
2. **Given** uma venda nova ou devolução, **When** consultar a lista, **Then** média e sugestão refletem a operação sem gravar outra venda.
3. **Given** parâmetros salvos, **When** reiniciar sem rede ou restaurar backup, **Then** conservar os dias e recalcular com as vendas locais.

### User Story 2 - Levar a lista de compras (Priority: P2)

O lojista filtra por nome/código, exporta os resultados visíveis e copia o texto para WhatsApp ou baixa PDF para imprimir.
**Why this priority**: Usar a sugestão durante a viagem ao atacado.
**Independent Test**: Buscar um produto; exportação contém esse produto e nenhuma linha oculta.
**Acceptance Scenarios**:

1. **Given** lista filtrada, **When** exportar, **Then** texto/PDF mostram nome, código, saldo, mínimo, alvo e compra de todos e somente os resultados visíveis.
2. **Given** lista vazia, **When** ver os controles, **Then** exportação fica desabilitada.
3. **Given** falha de cópia ou geração, **When** tentar exportar, **Then** mostrar orientação e manter o texto disponível, sem alterar dados.

### User Story 3 - Fechar a seleção de cliente (Priority: P2)

O operador fecha a folha pelo X centralizado em alvo circular consistente.
**Why this priority**: Corrigir a geometria enviada pelo proprietário.
**Independent Test**: Abrir seleção no Caixa em320/360/430px, verificar centro e círculo44px, fechar e retornar ao botão de seleção.
**Acceptance Scenarios**:

1. **Given** a folha aberta, **When** tocar X ou usar Escape, **Then** fechar sem modificar cliente/carrinho e restaurar foco.
2. **Given** tema claro/escuro e descrição longa, **When** abrir, **Then** título/descrição não se sobrepõem ao X.

### Edge Cases

Zero vendas: VMD0; saldo0 integra filtro com compra0 e aviso de ausência de vendas. Itens arquivados, serviços e combos não entram; demanda dos componentes do combo usa composição da venda. Quantidades devolvidas são subtraídas uma vez; vendas canceladas e futuras não contam. Código alterado conserva vínculo por ID; código reaproveitado não recebe vendas de outro ID. Unidades inteiras arredondam compra para cima; kg/l para cima até três casas. Janela inclui limite inicial e instante atual. Registros antigos são preservados, assim como pagamentos pendentes. Falhas de armazenamento não indicam sucesso.

## Requirements

### Functional Requirements

- **FR-001**: Calcular VMD = unidades líquidas registradas nas últimas720 horas /30, mínimo=VMD×MS, alvo=VMD×(DC+MS), compra=max(0,alvo−saldo), arredondada para uma quantidade comprável.
- **FR-002**: Filtrar produtos físicos ativos, sem composição própria, cujo saldo<=mínimo; mostrar sugestão em destaque somente no filtro baixo. Demanda de componentes e devoluções deve respeitar o histórico guardado.
- **FR-003**: Permitir salvar DC inteiro1–365 e MS inteiro0–365; padrão7/2; validação textual, prevenção de duplo envio e preservação offline/backup.
- **FR-004**: Recalcular após mudança nas vendas, produtos, parâmetros, abertura/retomada e passagem do tempo; não depender de servidor nem modificar estoque para calcular.
- **FR-005**: Manter a mesma regra de reposição em Estoque, Resumo e relatório de Gestão; conservar os dados históricos de mínimo manual, substituindo seu controle de alerta pela regra solicitada.
- **FR-006**: Exportar somente itens visíveis em ordem alfabética, com parâmetros, data/base e quantidades/unidades; oferecer cópia de texto e PDF local imprimível.
- **FR-007**: Usar alvo44×44px circular para fechar folhas de cliente, com ícone centralizado, nome acessível, foco visível, sem sobreposição e fechamento funcional.
- **FR-008**: Preservar dados, operação offline, scanner, pagamentos, assinatura e instalação sobre APK teste existente. Verificar com replica-test e testes de negócio, navegador e build Android.

### Key Entities

- Produto: identidade, código, nome, unidade, saldo e natureza física.
- Venda: instante, itens, composição e quantidade devolvida, situação.
- Parâmetros da loja: ciclo e margem em dias.
- Sugestão: valores derivados, sem persistência própria.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Exemplos de fronteira, devolução, combo e fracionados têm resultados exatos e não alteram o histórico.
- **SC-002**: Com10mil vendas e2mil produtos, o cálculo termina em menos de200ms no ambiente de verificação, com plataforma registrada.
- **SC-003**: Lista exportada coincide integralmente com resultados visíveis; recarga offline e backup conservam parâmetros.
- **SC-004**: X centralizado, circular e utilizável nos dois temas e em320/360/430px; nenhum erro de console ou violação automática de acessibilidade no fluxo.

## Assumptions

Janela móvel de720 horas até agora; divisor fixo30 inclusive para histórico curto. DC7/MS2 são valores iniciais editáveis. Média usa vendas líquidas como os relatórios existentes. Não inferir procura perdida por ruptura nem compras anteriores. Unidades do produto são coerentes com seu histórico. Exportação não registra pedido nem altera saldo. O compartilhamento com WhatsApp pode ser realizado colando o texto; não exige nova integração nativa. Validação física permanece distinta da automação.
