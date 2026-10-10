# Data model
Sem mudança de schema. entryChoice: total ou partial (sem null); entryRaw só afeta saldo e cobrança em partial. total - received - entrada planejada define saldo previsto. received deriva de pendingPayments persistidos; confirmar fiado chama checkout existente e cria venda/receivable/movimento uma vez. Data sugerida vem de dueDay; override afeta somente compra.
