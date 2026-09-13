# Som de "bip" ao ler o código de barras

O bip já é chamado nas duas telas (Caixa e Estoque), mas nos celulares o som costuma ficar mudo porque o navegador bloqueia o áudio até a pessoa tocar na tela pela primeira vez. O ajuste resolve isso e deixa o som mais parecido com o "bip" de leitor de mercado.

## Mudanças

1. **Desbloquear o som no primeiro toque**: ao abrir o app, o primeiro toque em qualquer lugar da tela libera o áudio do navegador (regra do Android/iPhone). A partir daí, todo bip sai normalmente.
2. **Acordar o áudio ao abrir a câmera**: ao tocar em "Abrir leitor de código" ou "Ler produto com a câmera", o áudio é liberado na hora, garantindo o bip na primeira leitura.
3. **Som mais forte e característico**: aumentar o volume e trocar o tom para um agudo curto (bip duplo, estilo leitor de caixa de mercado), audível mesmo em ambiente barulhento. Leitura de produto não cadastrado continua com som grave de erro.
4. Manter a vibração junto do bip, como já acontece.

Sem mudança visual: nada novo aparece na tela; só o som passa a funcionar de forma confiável.

## Detalhes técnicos

- `src/lib/feedback.ts`: `beep()` passa a chamar `audioCtx.resume()` antes de tocar; nova função `unlockAudio()` que cria/retoma o `AudioContext`; tom de sucesso vira dois pulsos em ~1568 Hz com ganho maior.
- `src/routes/__root.tsx`: listener único de `pointerdown`/`touchstart` no documento chamando `unlockAudio()` (registrado uma vez, removido após o primeiro toque).
- Botões que abrem o scanner (`src/routes/index.tsx` e `src/routes/estoque.tsx`) chamam `unlockAudio()` no clique.
- Teste com Playwright: conferir que `beep`/`unlockAudio` não quebram o fluxo e que a leitura manual continua bipando.
