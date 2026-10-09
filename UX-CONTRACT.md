# Contrato de interface

## Fiados — autorização de 08/10/2026

Primeira aba Fiados; Resumo da loja acessível em Ajustes. Cadastro exige nome, gera U-NNNN estável, admite telefone/CPF opcional e valida CPF/duplicidade. Cliente novo começa com fiado desabilitado; autorização, limite e dia habitual são configurados por proprietário/gerente. Legado conserva autorização anterior, sem limite inventado. Busca local por nome/código/telefone/CPF é transitória e não entra na URL; CPF mascarado na lista. Listas usam 20 registros e Ver mais. Arquivar exige confirmação e conserva extrato e recebimentos.

Selecionar cliente → busca ou Ler QR → conferir nome → confirmar. O QR contém UNIAO:CLIENTE:id, sem CPF e sem autenticação externa. BarcodeScanner usa o mesmo scanner embutido html5-qrcode já empregado nesta versão, com modo cliente/produto explícito; desmonta a câmera de produto durante seleção. Câmera física e permissões continuam verificações em aparelho.

Marcar na Conta → total ou entrada parcial → vencimento cadastral exibido no resumo → quatro abas diretamente cobrando só a entrada quando houver → retorno ao resumo → Registrar venda com fiado. Parcelas confirmadas persistem antes do fechamento; cliente/itens ficam bloqueados após recebimento. Limite bloqueia antes de cobrar entrada; atraso apenas avisa. Sem entrada registra fiado integral após confirmação. O sucesso informa saldo em aberto.

Receber no extrato → valor parcial ou saldo integral → dívida específica ou vencimentos mais antigos → mesmos quatro meios. Campo vazio escolhe saldo disponível conforme o padrão de dinheiro; zero/negativo/excesso são recusados. Abatimentos e um movimento de caixa por confirmação são atômicos/idempotentes, sem nova venda ou estoque. Recibo agrupa abatimentos da mesma confirmação; PDF de compra/cartão permanece disponível no perfil. Documentos são não fiscais. Caixa fechado/sem permissão bloqueia recebimento. Migração v8 e backup portátil preservam registros antigos.

## Gestão local — autorização de 08/10/2026

Fonte de negócio: MANAGEMENT-POLICY.md, aplicação autorizada pelo proprietário da análise OpenSourcePOS. As regras de estoque insuficiente, caixa fechado, cancelamento e identidade substituem explicitamente os comportamentos antigos descritos abaixo; não são alterações apenas de apresentação.

| Capacidade     | Proprietário                   | Fonte                    | Variantes                                                          | Verificação        |
| -------------- | ------------------------------ | ------------------------ | ------------------------------------------------------------------ | ------------------ |
| Form           | ManagementUI.LocalForm e Field | política e este contrato | criação/edição, validação própria, campos preservados em erro      | management E2E     |
| Select/Listbox | ManagementUI.Choice            | DESIGN.md                | native, popup do sistema aceito                                    | teclado e viewport |
| Date           | Input/Field                    | política de datas local  | native date/month                                                  | filtros e entrada  |
| Toast          | Sonner                         | paleta existente         | sucesso/aviso/erro                                                 | axe e console      |
| CRUD           | useStore/gestao                | MANAGEMENT-POLICY.md     | salvar no painel; arquivar com confirmação; eventos compensatórios | unitários e E2E    |
| Scrollbar      | styles.css                     | tokens existentes        | global, formulários com scroll do documento                        | overflow e foco    |

Listas de gestão exibem 20 registros e Ver mais. Busca local é transitória; não coloca contatos, motivos ou documentos comerciais na URL. Seção da gestão usa parâmetro sec para Voltar/Avançar. Alterações de outra aba reidratam dados; commit verifica revisão e rejeita sobrescrita stale. O app não promete sincronização entre aparelhos.

Equipe é opcional e identificada em Gestão; autorização é conferida no domínio. Bloquear ou recarregar encerra a identificação. Área sem permissão informa a restrição e encaminha à equipe. PIN não é incluído em backup portátil. Venda não requer cadastro de cliente; fiado exige cliente e vencimento.

Cancelamento/devolução usa Dialog com motivo, quantidade restante, destino e reembolso conferido. Produtos arquivados e fotos ficam preservados. Backup mostra prévia antes de confirmação app-owned; falha não destrói dados atuais. Importação CSV inválida não grava linhas parciais.

Parcelas recebidas e cotação ficam persistidas; fechar a folha não apaga recebimento. Alterar carrinho com parcelas exige devolução conferida. Notificação aguarda o valor da parcela, e só conclusão integral mostra confirmação verde de 2s. Fechamento bloqueia pagamentos pendentes. Uma parcela não é uma segunda venda.

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

## Geometria compartilhada dos pagamentos — 08/10/2026

PaymentSheet e os tokens --payment-* em src/styles.css são a fonte única das dimensões. Não criar altura de logo ou largura de aba específica para um meio. As variantes permitidas são composição interna: resumo/teclado de dinheiro, QR Pix ou ilustração/valor de cartão. Campos de dinheiro compartilham coluna, largura e alinhamento; ícones das quatro abas têm 18×18px e não encolhem.

A folha respeita 100dvh e os insets superior/inferior. Teclado e rodapé de confirmação não pertencem à rolagem do conteúdo central. Expandir a confirmação manual pode rolar apenas seu próprio rodapé; botão de confirmar fica acessível pelo toque e foco. A troca de meio conserva o enquadramento externo e o identificador Pix da sessão. Fluxos, notificações e persistência anteriores permanecem cobertos pelos testes existentes.

As áreas seguras de 24px são simuladas no navegador para verificar geometria, juntamente com um valor de R$ 1.234,56. Insets reais, escala de fonte do sistema, orientação horizontal e renderização do WebView exigem conferência física; não se declara cobertura desses estados a partir das simulações.

## Reposição local — 09/10/2026

Fonte comercial: MANAGEMENT-POLICY.md, seção Reposição por ciclo do atacado, e specs/002-estoque-reposicao/spec.md. Estoque, Resumo e Gestão usam useReplenishment/calculateReplenishment. Estoque baixo limita aos produtos físicos ativos elegíveis; busca continua transitória. Sugestão aparece no card somente nesse filtro. Configuração global na própria tela, sem exigir chave Pix: Field/LocalForm validam dias, guardam valores e mostram erro associado ao campo; permissão manage conserva proprietário/gerente.
Exportação é snapshot dos resultados visíveis ao abrir; mostra texto rotulado selecionável, Copiar lista e Baixar PDF. Falha de clipboard orienta cópia manual sem perder lista; PDF local usa jsPDF/autotable com paginação. Não registra pedidos nem movimentos. Sheet conserva foco, Escape e fundo inerte. customer-sheet > button recebe círculo44px e centro compartilhado; header/descrição reservam espaço.

## Escolha de pagamento — 09/10/2026

Caixa → Pagamento → Um meio de pagamento ou Dois meios de pagamento. PaymentSheet é o proprietário
compartilhado: escolha usa Sheet/Button/Input/Label e tokens existentes; sem Dividir sobre o card.
Dois meios pede primeira parte >0 e <saldo em centavos, mostra restante, recebe e segue para outro meio.
Primeiro meio fica indisponível na segunda parte. Parcela confirmada continua persistida ao fechar/recarregar,
com retomada direta do saldo. Fiado preserva resumo e registro; entrada e recebimento compartilham a escolha.
Cancelar a escolha não registra venda ou pagamento; foco retorna ao acionador. Sem alteração de paleta/schema.

## Fiado sem redundâncias — 09/10/2026
Marcar na Conta oferece total ou entrada parcial na folha existente. Vencimento calculado pelo dia cadastrado aparece como texto; Alterar vencimento desta compra é opcional e não altera o cadastro. Cadastros sem dia conservam a regra atual de 30 dias. Saldo previsto após confirmar deixa explícito que a dívida ainda não foi registrada. A entrada inicia diretamente nos quatro meios; Usar dois meios na entrada é uma ação secundária opcional que reutiliza o editor existente. Pagamento normal e recebimento de dívida conservam seus fluxos.
