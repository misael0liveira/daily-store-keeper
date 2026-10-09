# Gestão local — decisão de 08/10/2026

Fonte: pedido do proprietário para aplicar a análise OpenSourcePOS no APK teste. Implementação própria, sem incorporar código PHP. AGENTS.md mantém dados, scanner, operação local e assinatura. Não há processamento bancário ou envio de dados nesta entrega.

- Estoque controlado bloqueia quantidade insuficiente no fechamento. Serviços sem estoque são explícitos. Quantidade em un é inteira; kg/l admitem três casas decimais.
- Produtos recebem identidade estável. Arquivar preserva documentos, fotos e movimentos. Mudança de código conserva o id. Custos antigos desconhecidos permanecem desconhecidos.
- Compra confirmada registra recebimento, custo médio, lotes opcionais e movimentos numa gravação. Embalagens têm conversão explícita. Não há geração automática de pedidos.
- Venda guarda cotação, custo, composição do kit, operador, turno e pagamentos. Promoção expirada não muda a cotação aberta. Dinheiro vazio equivale ao valor exato, como antes. Parcelas só concluem a venda quando cobrem o total.
- Caixa fechado bloqueia fechamento de venda. A primeira sessão migrada usa fundo não informado (zero para a conferência), explicitamente rotulado. Próximas aberturas informam fundo. Pix/cartão não são dinheiro da gaveta.
- Cancelamento conserva documento e compensa apenas o que ainda não foi devolvido. Devolução exige motivo, limita quantidade e permite não recolocar item avariado. Reembolso é registro local de uma operação conferida; não estorna banco.
- Despesas, sangrias e suprimentos têm motivo. Recebimento de fiado não é nova venda. Fiado exige cliente e saldo restante explícito. Cancelar venda com recebimentos posteriores exige resolver a dívida primeiro.
- Equipe é opcional: proprietário, gerente e caixa. PINs são verificadores derivados com PBKDF2/sal aleatório; não há PIN em texto. Seleção/autorização é local, não proteção contra acesso administrativo ao aparelho. Sem equipe, abertura continua sem senha.
- Backup versionado inclui fotos; restauração substitui dados apenas após prévia e confirmação, preservando cópia anterior. Migração salva snapshot anterior. CSV é validado integralmente antes de gravar. Dados de equipe ficam fora do backup portátil e devem ser recadastrados.
- Uma aba pode operar de cada vez: gravação detecta revisão alterada em outra aba, reidrata e pede repetição; não sobrescreve silenciosamente. Não há sincronização remota ou multiaparelho.
- Datas e valores seguem pt-BR. Datas sem horário usam calendário local; relatórios distinguem mês fechado e últimos 30 dias.
- Impressão/recibos usam PDF e impressão disponível no sistema. Fiscal, estorno automático, integração direta Bluetooth e servidor multiaparelho não são simulados como recursos prontos.

## Alcance desta entrega

As fases locais 0–5 do plano foram adaptadas, com quantidade kg/l, combos, lotes, inventário, clientes e fiado das fases 6–7. Permanecem extensões separadas: códigos configuráveis de balança, estoque por local/transferências, fidelidade/vale-presente, catálogo de atributos livres e operação em vários aparelhos. Dependem de regras/configuração própria; não há botões fictícios para essas operações. Relatórios de gestão são locais; recibos, etiquetas e o histórico de vendas têm exportação PDF, e produtos têm CSV. A interface e o monitor brasileiro existentes foram conservados.

## Reposição por ciclo do atacado — decisão de 09/10/2026

Pedido do proprietário: substituir alerta estático por vendas locais dos últimos30dias. Janela móvel de720horas até agora, divisor30 inclusive no histórico curto. VMD soma quantidade líquida (vendida−devolvida); ignora cancelled/futuras, inclui consumo dos componentes pelo snapshot da venda, e vincula ID estável antes de código legado. Produtos arquivados, serviços e combos não recebem sugestão própria.
DC inteiro1–365 padrão7; MS inteiro0–365 padrão2. Mínimo=VMD×MS; alvo=VMD×(DC+MS). Estoque baixo quando saldo<=mínimo. Compra=max(0,alvo−saldo), arredondada para cima em un ou até3decimais em kg/l. Zero giro gera mínimo/alvo0; saldo0 aparece com compra0 e aviso para conferência. Não inferir consumo perdido nem estoque ideal quando não há histórico.
Parâmetros persistem offline e no backup; migração9 adiciona defaults sem apagar mínimos manuais históricos, vendas, carrinho, produtos ou demais configurações. O antigo campo manual deixa de governar alertas. Cálculo derivado não escreve médias/estoques, usa uma passagem e atualiza com fontes, abertura/retomada e relógio de1minuto. Recibos de dívida não aumentam vendas; devoluções são descontadas uma vez.
Exportar lista contém somente resultados visíveis, unidades e parâmetros, como sugestão para conferência; não cria compra, fornecedor ou movimentação. Cópia serve para colar no WhatsApp e PDF para impressão pelo sistema. Integração nativa de compartilhamento/impressora não é simulada.

## Escolha de pagamento — 09/10/2026

Caixa → Pagamento → Um meio de pagamento ou Dois meios de pagamento. PaymentSheet é o proprietário
compartilhado: escolha usa Sheet/Button/Input/Label e tokens existentes; sem Dividir sobre o card.
Dois meios pede primeira parte >0 e <saldo em centavos, mostra restante, recebe e segue para outro meio.
Primeiro meio fica indisponível na segunda parte. Parcela confirmada continua persistida ao fechar/recarregar,
com retomada direta do saldo. Fiado preserva resumo e registro; entrada e recebimento compartilham a escolha.
Cancelar a escolha não registra venda ou pagamento; foco retorna ao acionador. Sem alteração de paleta/schema.
