# Research

- Decision: reutilizar pagamentos persistidos do carrinho e PaymentSheet.
  Rationale: já há cotação, parcelas e monitor de valor exato; evita duas regras de recebimento.
  Alternative: duplicar tela rejeitado por divergência de geometria/monitoramento.
- Decision: coleta agrupada em um commit local, com recibo idempotente e movimento de caixa único.
  Rationale: collectDebt em sequência não garante atomicidade. Alternative: commits separados rejeitado.
- Decision: migração aditiva v8 com código sequencial estável associado aos IDs antigos, crédito anterior mantido.
  Rationale: preservar relações e backup sem alterar saldo. Alternative: recriar clientes rejeitado.
- Decision: QR prefixado usa ID interno; picker confirma o perfil antes de selecionar.
  Rationale: não confundir produtos nem expor CPF no QR. Alternative: QR com CPF rejeitado.
- Decision: manter câmera embutida atual em ambos os modos.
  Rationale: BarcodeScanner é o proprietário atual, apesar de referências antigas ao ML Kit.
- Referências pesquisadas: Loyverse scanning-customer-barcode; Bling Frente de Caixa;
  Odoo customer_credit. Políticas aprovadas na conversa prevalecem.
