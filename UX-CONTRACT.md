# Contrato de interface

## Fontes

AGENTS.md: preservar dados, fluxo offline, scanner e atualização Android. Aprovação do usuário em 22/09/2026: aplicar a proposta visual. Implementação existente em useStore.ts: regras de quantidade, venda, estoque e exclusão. A apresentação não cria novas regras de negócio.

## Fluxos

- Abertura: fundo nativo branco sem marca; AppStartup exibe o mesmo logotipo do APK oficial por dois segundos, e o Início usa o mesmo PNG transparente e ícone. Cada inicialização fria do APK navega para o Caixa uma única vez; depois, todas as abas continuam acessíveis.
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

Em 06/10/2026, o usuário solicitou remover o botão “Digitar código”. A câmera ativa não mostra esse botão; busca por nome/código no Caixa e campo de código no editor continuam manuais. Em falha de câmera, o Input numérico permanece visível. A entrada usa type=text, inputMode=numeric e enterKeyHint=done, preservando zeros à esquerda. O campo aceita também códigos colados; a busca por nome/código do Caixa continua textual. Enquanto a entrada manual está ativa, ignorar resultados da câmera. “Usar código” e Enter entregam o valor ao mesmo onScan; vazio não envia, composição IME não envia antecipadamente. Após enviar, limpar o campo e evitar releitura imediata do mesmo código. Em falha ou permissão negada, manter entrada manual visível. O campo de código no cadastro também solicita teclado numérico. A aparência do teclado e o foco físico da câmera são controlados pelo Android/aparelho e precisam de validação no dispositivo.

## Fotos e promoções — solicitação de 06/10/2026

- Foto: tirar com `input capture=environment` ou carregar arquivo; o BridgeWebChromeClient do Capacitor existente abre câmera ou seletor e solicita permissão quando necessário. Pausar a câmera do código durante captura da foto e restaurá-la ao retornar/cancelar. Foto opcional, prévia antes de salvar e remoção explícita; cancelar o editor não altera a foto salva. Imagens de até 20 MB são reduzidas a JPEG 512×512 com margens brancas. Fotos ficam no IndexedDB `mercadinho-product-photos`; somente photoId fica no Product/Zustand, sem encher localStorage com imagens. Falhas mantêm o formulário e mostram erro, sem remoção dos dados antigos.
- Fundo branco: composição local sempre em branco; opção substitui apenas fundo liso conectado às bordas e detectado por cores semelhantes em pelo menos três cantos. Fundo variado é preservado e uma mensagem informa a limitação. Prévia e opção de desativar permitem revisão; não há IA remota, OCR, nuvem ou necessidade de internet.
- Promoção: filtro Promoção → busca nome/código ou scanner → adicionar um ou mais produtos → Prosseguir → Dialog. Um produto tem nome, valor original e desconto lado a lado, duração abaixo. Vários usam cartões próprios com foto e os mesmos campos; cada um pode ter desconto/duração diferentes. Cancelar não persiste. Aplicar valida o lote inteiro e grava uma vez; falha de armazenamento reverte também o estado em memória. Valor original pode ser corrigido neste formulário; produto/foto/estoque são preservados.
- Desconto maior que 0% e no máximo 100%, calculado em centavos por unidade. Período começa à meia-noite local da data inicial e inclui todo o dia final; somente intervalo válido com fim futuro é salvo. Campanha por estoque encerra quando a venda esgota o saldo, ou o proprietário zera estoque; reposição posterior não reativa essa campanha. Encerrar promoção mantém produto, foto, estoque e preço original.
- Caixa usa a mesma função de preço que a gravação da venda. Ao abrir o pagamento, fixa os itens, valores e total daquela cobrança, inclusive se a promoção expirar durante o pagamento. Mudança de itens/quantidades invalida a confirmação. Histórico guarda preço vendido e, quando aplicável, preço original e percentual; vendas anteriores continuam legíveis. Produtos antigos sem foto/promoção continuam válidos, sem migração destrutiva.
- Datas usam Input date nativo conforme o mapa canônico; escolha de duração usa radio nativo com labels. Fotos, descontos, carrinho e vendas funcionam offline. Testes automatizados: tests/pdv-regressions.test.mjs e tests/promotions-browser.cjs. Câmera/teclado físico e atualização sobre APK instalado ainda precisam de teste no aparelho.

## Pagamentos em dinheiro, Pix e cartão

- Dinheiro: teclado local fixo, vírgula, apagar e limpar funcionais; valor vazio equivale ao total exato. Valor inferior ao total bloqueia PAGO. Troco arredondado em centavos. Não abre o teclado nativo.
- Pix: gerador de QR carregado junto com o pagamento, sem importação tardia durante uso offline; chave e identificador individual preservados; reconhecimento de Pix recebido e valor esperado permanece independente da lista de adquirentes.
- Débito/crédito: aguarda notificação do aplicativo oficial Mercado Pago (`com.mercadopago.wallet`), PagBank (`br.com.uol.ps.myaccount`), Ton (`br.com.stone.ton`) ou SumUp comerciante (`com.kaching.merchant`). A lista vem das páginas oficiais do Google Play; SumUp Pay consumidor não integra a lista.
- Reconhecimento de cartão exige indicação explícita de venda aprovada/concluída ou recebimento via cartão, valor exato e notificação posterior à abertura do monitor. Compra do cliente, Pix, estorno, bônus/cashback, saldo liberado, tipo conflitante ou mais de um valor distinto são recusados. Texto desconhecido permanece aguardando; confirmação manual continua disponível após conferência do recebimento.
- Monitor identifica sessão e meio; respostas atrasadas não confirmam outra venda. Limpeza de sessão antiga não apaga a atual. Android rejeita resumos de notificações e mantém até 64 identificadores já consumidos para impedir reaproveitamento. Texto integral da notificação não é persistido nem devolvido ao JavaScript. Monitores nativos expiram após 15 minutos; fechar/reabrir o pagamento inicia outro.
- A venda e o estoque são persistidos antes da animação verde de 2 segundos. Durante sucesso não se pode confirmar novamente nem fechar por Escape. Depois retorna ao Caixa. Se checkout falha, não há indicação de sucesso.
- Mesmas permissões, plugin e serviço Android; scanner, armazenamento, assinatura e identificador do APK oficial preservados. Compatibilidade real com cada formato de notificação exige teste no aparelho: fixtures Java são sintéticas, sem promessa de reconhecer todo texto de todas as versões dos provedores.

Fontes dos identificadores: https://play.google.com/store/apps/details?id=com.mercadopago.wallet ; https://play.google.com/store/apps/details?id=br.com.uol.ps.myaccount ; https://play.google.com/store/apps/details?id=br.com.stone.ton ; https://play.google.com/store/apps/details?id=com.kaching.merchant .

## Contrato de cores — 08/10/2026

src/theme/palette.css é o proprietário dos valores de claro/escuro e das superfícies fixas de arte/QR/câmera/pagamento. src/styles.css é o adaptador para utilities e composição. Button, Input, Sheet, Dialog e Sonner compartilham esses papéis. Uma nova tela escolhe o papel de cada estado e não insere novos hexadecimais em JSX.

Sonner acompanha o tema salvo e mapeia normal/sucesso/informação/aviso/erro para esses tokens. Avisos em superfície suave usam texto semântico, não foreground de um botão sólido. Status de monitoramento e preço usam o mesmo sucesso, sem tornar ações de navegação verdes.

A apresentação não altera regras de venda, permissões, storage, identificador ou assinatura. A única revisão Android remove a reaplicação fixa de ícones escuros no MainActivity: SystemBars do Capacitor recebe o tema no NativeThemeBars e na retomada; a configuração inicial LIGHT preserva a abertura branca. Insets, barras transparentes e comportamento do scanner são mantidos. Build e assinatura são verificados; aparência física e atualização no aparelho permanecem verificações manuais.
