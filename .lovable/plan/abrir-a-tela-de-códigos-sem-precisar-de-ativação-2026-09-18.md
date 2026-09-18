# Abrir a tela de códigos sem precisar de ativação

## Problema

Hoje a tela de ativação cobre o app inteiro. Para chegar em **Códigos de ativação** o celular já precisa estar liberado com um código — o que trava justamente quem precisa gerar o primeiro código.

## O que muda

- O endereço `/codigos` passa a abrir direto, sem pedir código de ativação.
- A proteção continua: para ver e gerar códigos ainda é obrigatório digitar a senha de administrador.
- Todas as outras telas (Início, Vender, Estoque, Mais, Vendas) seguem exigindo o código de ativação como hoje.
- A barra superior e a barra inferior não aparecem nessa tela quando o aparelho ainda não está ativado, para não levar a telas bloqueadas.

## Validação

- Abrir `/codigos` num aparelho "novo" (sem ativação) e confirmar que aparece a senha de administrador, não a tela de código de ativação.
- Com a senha correta, gerar um código e confirmar que aparece na lista.
- Confirmar que a tela inicial continua pedindo o código de ativação.

## Detalhes técnicos

- Em `src/routes/__root.tsx`, ler o pathname atual (`useRouterState`) e renderizar o conteúdo fora de `<AuthGate>` quando a rota é `/codigos`; nesse caso ocultar `Header`/`BottomNav` se não houver ativação salva, mantendo `ThemeApplier` e `Toaster`.
- Nenhuma mudança em `src/lib/licenses.functions.ts`: a senha de administrador (`ADMIN_LICENSE_PASSWORD`) continua sendo a única barreira do lado do servidor.
