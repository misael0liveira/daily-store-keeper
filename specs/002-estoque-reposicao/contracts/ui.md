# UI contract

Estoque conserva Todos/Estoque baixo/Promoção, busca e editor. Em baixo mostra base30dias e parâmetros, ação Exportar lista (desabilitada se vazio); cards mostram sugestão e ausência de vendas quando cabível. Configurar reposição usa details/LocalForm e campos com nomes em pt-BR; salvar atualiza a lista e persiste sem depender da chave Pix.
Exportar abre Sheet com texto readonly rotulado, Copiar lista e Baixar PDF. Clipboard indisponível conserva seleção manual; PDF inicia download local. Sem alterações comerciais. Cabeçalho reserva espaço para X.
Fechar cliente usa CSS customer-sheet proprietário:44px, círculo, flex central, borda semântica. Sheet/Radix preserva foco/Escape/fundo inerte. Referências: DESIGN.md, UX-CONTRACT.md, MANAGEMENT-POLICY.md.
