# PDV Mini Mercado — App instalável para celular

App de caixa e estoque para mini mercado, feito para celular, funcionando sem internet. Os dados ficam salvos no próprio aparelho.

## Navegação

Barra fixa embaixo com duas abas: **Caixa** (carrinho) e **Estoque** (caixa/lista). Botão de tema claro/escuro no topo.

```text
┌──────────────────────────┐
│  Mini Mercado      ☀/🌙  │
│                          │
│   [ conteúdo da aba ]    │
│                          │
│  Total R$ 42,90          │
│  [ Finalizar Compra ]    │
├──────────────────────────┤
│   🛒 Caixa   📦 Estoque  │
└──────────────────────────┘
```

## Tela Caixa

- Botão para abrir/fechar a câmera (fechada por padrão, para poupar bateria).
- Leitura com moldura guia sobre a imagem da câmera.
- Código lido e encontrado no estoque: item entra no carrinho, com bipe, vibração e aviso de sucesso.
- Código não cadastrado: aviso vermelho "Produto não cadastrado".
- Carrinho: nome, preço unitário, botões + e −, lixeira para remover.
- Rodapé fixo: total em destaque em reais e botão grande "Finalizar Compra", que baixa o estoque dos itens vendidos, limpa o carrinho e mostra confirmação.
- Se a câmera for negada, aparece campo para digitar o código manualmente.

## Tela Estoque

- Câmera no topo para ler o produto a cadastrar/editar, mais campo manual.
- Formulário: código de barras, nome, preço (R$), quantidade.
- Código já existente: campos preenchidos, botão vira "Atualizar Produto" e aparece botão vermelho "Excluir Produto" (com confirmação).
- Código novo: botão "Cadastrar Produto".
- Abaixo, lista dos produtos com busca por nome; tocar num produto carrega ele no formulário.

## Visual

- Estilo limpo e moderno, tema próprio (verde/mercado) com claro e escuro, ícones Lucide, botões com área de toque grande, valores sempre em R$.

## Instalação na tela inicial

- Manifesto e ícones para "Adicionar à tela de início". Sem modo offline por cache de arquivos (os dados já ficam no aparelho); posso adicionar depois se quiser abrir totalmente sem internet.

## Detalhes técnicos

- Zustand + persist no `localStorage` (`store/useStore.ts`): produtos, carrinho, tema.
- `html5-qrcode` encapsulado em `components/BarcodeScanner.tsx`, carregado só no cliente (`ClientOnly` + import dinâmico), com fallback manual e tratamento de `NotAllowedError`.
- Beep via WebAudio + `navigator.vibrate`, toasts com `sonner` (`<Toaster />` no `__root.tsx`).
- Rotas: `src/routes/index.tsx` (Caixa) e `src/routes/estoque.tsx`, layout com barra inferior no `__root.tsx`; head próprio por rota.
- Tokens de cor em `src/styles.css`; dark mode por classe `.dark` no `<html>`.
- `public/manifest.webmanifest` + ícones + tags no head do root (sem service worker).
