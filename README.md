# Mini Market POS

Crie um Progressive Web App (PWA) mobile-first para gestão e frente de caixa (PDV) de um mini mercado. O design deve ser moderno, limpo, responsivo e otimizado para uso em smartphones, utilizando React, Tailwind CSS e componentes do Shadcn UI. 



A persistência de dados deve ser feita inteiramente no `localStorage` do navegador para que o app funcione offline imediatamente, gerenciada por um hook customizado ou Zustand.



## 🛠 Arquitetura de UI e Navegação

O layout deve ter um "Bottom Navigation Bar" (barra de navegação inferior) estilo app nativo, contendo duas abas principais:

1. "Caixa" (Ícone de carrinho ou scanner)

2. "Estoque" (Ícone de caixa ou lista)



## 📷 Requisito Crítico: Leitor de Código de Barras

Integre uma biblioteca robusta de leitura de código de barras pela câmera do dispositivo (como `html5-qrcode` ou `react-barcode-reader`). 

- A interface da câmera deve ter um overlay guiando onde o código deve ser posicionado.

- Adicione tratamento de erros elegante caso o usuário negue a permissão da câmera, oferecendo um input manual para digitar o código de barras como fallback.

- Use efeitos sonoros (beep) ou feedback tátil (vibration API) e Toast notifications quando um código for lido com sucesso.



## 📱 Tela 1: Caixa (Frente de Loja)

- Área superior com o leitor de código de barras (botão para abrir/fechar a câmera para poupar bateria).

- Ao ler um código, o app deve buscar no estoque (localStorage). Se existir, adiciona automaticamente ao carrinho. Se não existir, dispara um Toast de erro: "Produto não cadastrado".

- Lista do carrinho: exibe os itens lidos com nome, preço unitário, controles de quantidade (+ e -) e botão de remover item (Lixeira).

- Área inferior fixada: exibe o "Total da Compra" em destaque (R$) e um botão grande e acessível "Finalizar Compra" (que limpa o carrinho e exibe um alerta de sucesso).



## 📦 Tela 2: Estoque (Gestão de Produtos)

- Área superior com o leitor de câmera para ler o produto que será cadastrado ou editado.

- Formulário de Produto: Código de Barras (preenchido pela câmera ou digitado), Nome do Produto, Preço (R$), e Quantidade em Estoque.

- Lógica: Se a câmera ler um código que já existe no sistema, preenche o formulário com os dados atuais e altera o botão principal para "Atualizar Produto". Adiciona também um botão vermelho "Excluir Produto". Se for um código novo, o botão principal é "Cadastrar Produto".

- Abaixo do formulário, exiba uma lista ou grid com todos os produtos cadastrados atualmente no sistema, com uma barra de busca rápida por nome.



## 🎨 UI/UX e PWA

- Use ícones do Lucide React.

- Implemente Dark Mode/Light Mode toggle.

- Formate todos os valores monetários para a moeda local (BRL).

- Configure o manifesto do PWA (manifest.json) para permitir instalação na tela inicial ("Add to Home Screen").

- Garanta que os botões tenham uma "touch target" (área de toque) grande o suficiente para uso rápido e ergonômico no celular.


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
