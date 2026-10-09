# Data model
Estado transitório: choosing boolean; splitOpen boolean; splitRaw string; firstMethod PaymentMethod opcional.
Primeira parte em centavos: >0 e <saldo, dois decimais no máximo. Total<0.02 bloqueia dois meios.
Parcelas/cotação: modelo existente de useStore. Sem schema ou migração. previousMethod vem da última parcela.
