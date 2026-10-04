# Contrato de interface

## Fontes

AGENTS.md: preservar dados, fluxo offline, scanner e atualização Android. Aprovação do usuário em 22/09/2026: aplicar a proposta visual. Implementação existente em useStore.ts: regras de quantidade, venda, estoque e exclusão. A apresentação não cria novas regras de negócio.

## Fluxos

- Abertura: fundo nativo branco sem marca; AppStartup exibe o mesmo logotipo do APK oficial por quatro segundos, e o Início usa o mesmo PNG transparente e ícone.
- Cadastro sem OCR: a câmera lê apenas o código de barras; nome, marca, embalagem, preço e quantidade são preenchidos manualmente. O leitor de código de barras e os dados locais permanecem disponíveis offline.
- Venda: Início → Caixa → PaymentSheet existente → registro local existente. Diminuir quantidade de 1 remove a linha, conforme changeQty. Câmera montada, leituras não alteram carrinho durante pagamento.
- Estoque: lista → Cadastrar ou produto → Sheet → salvar → lista, mantendo busca/filtro. No cadastro, a câmera abre junto com o editor, permanece aberta após a leitura e termina somente ao fechar o Sheet. Fechar cancela a edição visível; dados persistidos não mudam antes de salvar. Salvamento bloqueia envios simultâneos.
- Câmera: Caixa e Estoque reutilizam o mesmo componente de prévia e leitura. Quando a câmera informa suporte à lanterna, um controle compacto no canto superior direito da imagem alterna flash ligado/desligado; aparelhos sem suporte não exibem controle inutilizável.
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

## APK de teste

O teste mantém o applicationId app.minimarket.pos.visiontest, os dados próprios. É compilado como release, assinado pela configuração debug do Gradle, para aproximar o tamanho e o empacotamento do oficial; permanece instalado separadamente. Não inclui bibliotecas, modelos ou ações de OCR. O cache anterior não salvava o arquivo gerado pelo AGP em ~/.config/.android/debug.keystore; a chave antiga não é recuperável. O cache passa a cobrir ambos os caminhos. O Android pode rejeitar uma atualização sobre testes antigos por diferença de assinatura; não desinstalar nem apagar dados automaticamente.

## Navegação CODEXURE do teste

BottomNavigation é o proprietário compartilhado da barra em todas as rotas. Links reais preservam destinos e histórico do router; /vendas/configuracoes continua selecionando Ajustes. aria-current identifica a página ativa; os cinco links mantêm aria-label em português mesmo com apenas um rótulo visível. A bolha e o contorno animam juntos; troca rápida cancela a animação anterior. Preferência de movimento reduzido é respeitada. O pagamento permanece acima da barra e nenhum dado local muda na navegação. Tokens e proporções estão em DESIGN.md e src/styles.css.

## Pix por pagamento

Ao abrir um novo pagamento no Caixa, gerar um txid aleatório de 25 caracteres alfanuméricos, sem depender do valor ou da internet. Manter esse identificador durante as renderizações e trocas de método do mesmo pagamento. Nova abertura cria uma nova referência, inclusive após cancelamento. QR Code e Copia e Cola usam o mesmo payload; a confirmação manual e a confirmação por notificação salvam pixTxid junto da venda. Vendas antigas continuam válidas sem esse campo. A prévia genérica nas configurações mantém *** e não representa uma venda. O código permanece um QR estático com referência individual, sem integração de cobrança dinâmica bancária.

Verificação: testes de referências distintas mesmo com relógio fixo, limites do campo e checksum do exemplo oficial; fluxo no navegador com duas vendas de R$ 20, QR e Copia e Cola distintos, referência estável durante o pagamento, segunda venda offline, persistência e redução de estoque. A aceitação e os avisos do aplicativo do banco precisam ser conferidos no aparelho.

## Foco e entrada manual do scanner

BarcodeScanner é o proprietário compartilhado no Caixa e no editor de Estoque. Solicitar câmera traseira com resolução ideal 1280 × 720; ajustes ideais permitem resolução menor. Aplicar foco contínuo somente quando getRunningTrackCapabilities informa suporte; falha nesse ajuste não impede leitura nem lanterna. Controle opcional está em src/lib/scannerCamera.ts.

“Digitar código” monta e foca o Input durante o toque para solicitar o teclado numérico. A entrada usa type=text, inputMode=numeric e enterKeyHint=done, preservando zeros à esquerda. O campo aceita também códigos colados; a busca por nome/código do Caixa continua textual. Enquanto a entrada manual está ativa, ignorar resultados da câmera. “Usar código” e Enter entregam o valor ao mesmo onScan; vazio não envia, composição IME não envia antecipadamente. Cancelar preserva o texto, fecha a entrada e devolve foco ao botão. Após enviar, limpar o campo e evitar releitura imediata do mesmo código. Em falha ou permissão negada, manter entrada manual visível. O campo de código no cadastro também solicita teclado numérico. A aparência do teclado e o foco físico da câmera são controlados pelo Android/aparelho e precisam de validação no dispositivo.
