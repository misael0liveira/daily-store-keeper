# Data model

Customer mantém id/name/contact/active; acrescenta code único e estável, cpf opcional (11 dígitos
válidos e único), creditEnabled, creditLimit opcional >=0 em reais, arredondado em centavos, dueDay opcional inteiro 1–31.
Cliente antigo: código sequencial U-NNNN associado ao ID existente, creditEnabled=true se ausente; novo false por padrão.
Receivable preserva id/saleId/customerId/timestamp/dueAt/original/balance/receipts.
Receipt preserva id/timestamp/amount/method e admite reference/source/bank opcionais.
Uma coleta agrupada reparte amount em dívidas ordenadas por dueAt/timestamp/id, um único commit;
mesmo id entre abatimentos corresponde ao mesmo recibo, com um movimento de caixa total.
Revalidar saldo/limite/permissão/caixa no commit. Nenhuma exclusão de histórico.
