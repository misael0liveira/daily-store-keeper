package app.minimarket.pos;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Conservative text recognition, independent of Android for regression tests.
 * These rules are not provider APIs; unknown or ambiguous notifications stay pending. */
final class PaymentNotificationMatcher {
    private static final Pattern MONEY = Pattern.compile(
            "(?i)(?<![\\d.,])(?:r\\$\\s*)?(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+[.,]\\d{2})(?![\\d.,])");
    private static final Pattern NEGATIVE = Pattern.compile(
            "estorn|cancel|recusad|rejeitad|negad|reembols|devolvid|pendente|aguardando|"
            + "nao.{0,35}(?:aprov|confirm|conclu|receb|realiz)|(?:a|para) receber");
    private static final Pattern SALE = Pattern.compile(
            "\\bvenda\\b.{0,60}(?:aprovad|confirmad|realizad|concluid|recebid|processad)|"
            + "(?:aprovad|confirmad|realizad|concluid|recebid).{0,30}\\bvenda\\b");
    private static final Pattern RECEIVED = Pattern.compile(
            "pagamento (?:foi )?recebido|voce recebeu|recebimento (?:de |via )?cartao");

    static boolean isCardProvider(String packageName) {
        return "com.mercadopago.wallet".equals(packageName)
                || "br.com.uol.ps.myaccount".equals(packageName)
                || "br.com.stone.ton".equals(packageName)
                || "com.kaching.merchant".equals(packageName);
    }

    static String providerName(String packageName) {
        if ("com.mercadopago.wallet".equals(packageName)) return "Mercado Pago";
        if ("br.com.uol.ps.myaccount".equals(packageName)) return "PagBank";
        if ("br.com.stone.ton".equals(packageName)) return "Ton";
        if ("com.kaching.merchant".equals(packageName)) return "SumUp";
        return packageName;
    }

    static Long match(String packageName, String text, String method, long expectedCents) {
        if (text == null || expectedCents <= 0) return null;
        String n = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT)
                .replace('\u00a0', ' ').replaceAll("\\s+", " ");
        if (NEGATIVE.matcher(n).find()) return null;
        boolean pix = Pattern.compile("\\bpix\\b").matcher(n).find();
        boolean card = "debito".equals(method) || "credito".equals(method);
        if ("pix".equals(method)) {
            // Preserve the existing received-Pix flow, including bank apps beyond the card list.
            if (!pix || !(n.contains("recebid") || n.contains("recebimento"))) return null;
            if (n.contains("pix enviado") || n.contains("pix realizado") || n.contains("voce pagou")) return null;
        } else if (card) {
            if (!isCardProvider(packageName) || pix) return null;
            // A card purchase or money released to the account is not a new merchant sale.
            if (n.matches(".*(?:\\bcompra\\b|voce pagou|voce gastou|transferencia|\\bted\\b|deposito|saldo|antecip|recebiveis|liberad|lote).*")) return null;
            if (!SALE.matcher(n).find() && !(RECEIVED.matcher(n).find() &&
                    (n.contains("cartao") || n.contains("debito") || n.contains("credito")))) return null;
            if ("debito".equals(method) && n.contains("credito") && !n.contains("debito")) return null;
            if ("credito".equals(method) && n.contains("debito") && !n.contains("credito")) return null;
        } else return null;

        Set<Long> amounts = new LinkedHashSet<>();
        Matcher matcher = MONEY.matcher(text.replace('\u00a0', ' '));
        while (matcher.find()) {
            String value = matcher.group(1);
            if (value.contains(",")) value = value.replace(".", "").replace(',', '.');
            try { amounts.add(new BigDecimal(value).movePointRight(2).longValueExact()); }
            catch (ArithmeticException | NumberFormatException ignored) { return null; }
        }
        if (amounts.isEmpty()) return null;
        // Pix retains its first-value rule. Card refuses net/gross/balance ambiguity.
        if (card && amounts.size() != 1) return null;
        long amount = amounts.iterator().next();
        return amount == expectedCents ? amount : null;
    }
}
