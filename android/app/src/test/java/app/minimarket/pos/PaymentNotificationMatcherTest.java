package app.minimarket.pos;

import static org.junit.Assert.*;
import org.junit.Test;

public class PaymentNotificationMatcherTest {
    private static final String[] PROVIDERS = { "com.mercadopago.wallet", "br.com.uol.ps.myaccount",
            "br.com.stone.ton", "com.kaching.merchant" };
    // Synthetic fixtures verify rules. They are not captured provider notification templates.
    @Test public void approvesExplicitSalesFromAllFourProviders() {
        for (String provider : PROVIDERS) {
            assertEquals(Long.valueOf(424), PaymentNotificationMatcher.match(provider, "Venda aprovada! R$ 4,24", "debito", 424));
            assertEquals(Long.valueOf(424), PaymentNotificationMatcher.match(provider, "Pagamento recebido no cartão de crédito: R$ 4,24", "credito", 424));
            assertEquals(Long.valueOf(123456), PaymentNotificationMatcher.match(provider, "Venda confirmada R$ 1.234,56", "credito", 123456));
        }
    }
    @Test public void rejectsPurchasesOtherAppsAndOtherMethods() {
        assertNull(PaymentNotificationMatcher.match("com.sumup.pay", "Venda aprovada R$ 4,24", "debito", 424));
        assertNull(PaymentNotificationMatcher.match("com.fake.wallet", "Venda aprovada R$ 4,24", "debito", 424));
        for (String text : new String[] { "Compra aprovada R$ 4,24", "Você recebeu R$ 4,24", "Pix recebido R$ 4,24",
                "Venda aprovada no crédito R$ 4,24", "Venda aprovada R$ 4,25", "Saldo liberado R$ 4,24",
                "Venda não aprovada R$ 4,24", "Venda cancelada R$ 4,24", "Venda aprovada com estorno R$ 4,24",
                "Venda aprovada total R$ 4,24 líquido R$ 4,00", "Venda aprovada R$ 4,24 aguardando pagamento",
                "Pagamento no cartão a receber R$ 4,24", "Ganhe cashback de R$ 4,24 na primeira venda aprovada",
                "Bônus por venda aprovada R$ 4,24" }) {
            assertNull(text, PaymentNotificationMatcher.match(PROVIDERS[0], text, "debito", 424));
        }
        assertNull(PaymentNotificationMatcher.match(PROVIDERS[0], "Venda aprovada no débito R$ 4,24", "credito", 424));
    }
    @Test public void handlesExpandedDuplicateTextAndBothDecimalFormats() {
        assertEquals(Long.valueOf(424), PaymentNotificationMatcher.match(PROVIDERS[0], "Venda aprovada R$ 4,24 · Venda aprovada R$ 4,24", "debito", 424));
        assertEquals(Long.valueOf(5000), PaymentNotificationMatcher.match(PROVIDERS[0], "Venda aprovada R$ 50.00", "debito", 5000));
        assertNull(PaymentNotificationMatcher.match(PROVIDERS[0], "Venda aprovada referência 1234", "debito", 123400));
    }
    @Test public void preservesReceivedPixFromOtherBanksAndRejectsOutgoing() {
        assertEquals(Long.valueOf(424), PaymentNotificationMatcher.match("com.bank.app", "Pix recebido R$ 4,24", "pix", 424));
        assertNull(PaymentNotificationMatcher.match("com.bank.app", "Pix enviado R$ 4,24", "pix", 424));
        assertNull(PaymentNotificationMatcher.match("com.bank.app", "Pix recebido R$ 4,25", "pix", 424));
    }
}
