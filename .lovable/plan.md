# Códigos de ativação do Mini Market POS

## Objetivo

O app já pede um código de ativação na abertura (tela "Digite o código de ativação"), mas o banco de dados ainda não tem onde guardar esses códigos nem a função que valida — hoje qualquer tentativa falha. Vamos criar isso e gerar um código de teste para você ativar o app no seu celular.

## O que será criado

1. **Tabela de códigos de licença** no banco: código (ex.: `MK-TEST-2026`), se está ativo, a qual aparelho está vinculado e data de criação. Protegida por regras de acesso — ninguém lê a lista de códigos pelo app.

2. **Função de validação no banco** (`activate_device_license`) que o app já chama:
   - código não existe → "Código inválido"
   - código desativado → "Este código está desativado"
   - código já vinculado a outro aparelho → "Este código já está vinculado a outro celular"
   - código válido → vincula ao aparelho e libera o app (se o mesmo aparelho reinstalar, ativa de novo sem erro)

3. **Código de teste criado na hora**: `MK-TEST-2026`, já ativo. É ele que você digita no app para testar a ativação.

## Validação

- Consultar o banco e confirmar que o código de teste existe e está ativo.
- Abrir o app no navegador de teste, digitar `MK-TEST-2026` e confirmar que o app libera a tela inicial.
- Testar as mensagens de erro com um código errado.

## Depois deste passo (fora deste plano)

- Uma telinha para você gerar novos códigos para outros aparelhos/revendedores pode ser o próximo passo, se quiser.

## Detalhes técnicos

- Migration com `CREATE TABLE public.license_codes` + `GRANT`s (sem SELECT para anon — validação só via RPC), RLS habilitado, função `activate_device_license(p_code text, p_device_id text)` como SECURITY DEFINER, e `INSERT` do código de teste `MK-TEST-2026`.
- Nenhuma mudança no código do app é necessária: `src/components/AuthGate.tsx` já chama essa função e já trata todos os retornos.
