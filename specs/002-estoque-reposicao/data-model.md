# Data model

Settings adiciona wholesaleCycleDays: inteiro1–365 padrão7 e stockSafetyDays: inteiro0–365 padrão2. setSettings valida antes de commit, preservando outras chaves. Migração9 e restauração adicionam defaults; backup antigo é aceito e backup novo preserva ambos.
Replenishment por código atual: sold30, dailyAverage, minimum, target, purchase, low, product. Derivado de products/sales/settings/now; não grava estoque nem vendas. Elegibilidade: ativo/controlado/sem components. Compra ceil para un, ceil3 para kg/l. productId na venda prevalece sobre barcode; componentes guardados na venda prevalecem sobre combo atual.
