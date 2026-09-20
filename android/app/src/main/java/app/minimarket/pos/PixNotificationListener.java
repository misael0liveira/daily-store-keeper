package app.minimarket.pos;

import android.app.Notification;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PixNotificationListener extends NotificationListenerService {
    private static final String PREFS = "pix_notification";
    private static final String KEY_EXPECTED_AMOUNT = "expected_amount";
    private static final String KEY_EXPECTED_SINCE = "expected_since";
    private static final String KEY_LAST_AMOUNT = "last_amount";
    private static final String KEY_LAST_TIMESTAMP = "last_timestamp";
    private static final String KEY_LAST_BANK = "last_bank";
    private static final String KEY_LAST_PACKAGE = "last_package";
    private static final String KEY_LAST_TEXT = "last_text";

    private static final Pattern MONEY = Pattern.compile(
            "(?i)(?:r\\$\\s*)?(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+(?:[.,]\\d{2}))"
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getPackageName() == null) return;
        if (sbn.getPackageName().equals(getPackageName())) return;

        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String expectedRaw = prefs.getString(KEY_EXPECTED_AMOUNT, "");
        if (TextUtils.isEmpty(expectedRaw)) return;

        long expectedSince = prefs.getLong(KEY_EXPECTED_SINCE, 0);
        long postedAt = sbn.getPostTime();
        if (postedAt < expectedSince) return;

        String text = extractNotificationText(sbn.getNotification());
        if (TextUtils.isEmpty(text)) return;

        String normalized = normalize(text);
        if (!looksLikeReceivedPix(normalized)) return;

        Double amount = extractAmount(text);
        if (amount == null) return;

        double expected;
        try {
            expected = Double.parseDouble(expectedRaw);
        } catch (NumberFormatException e) {
            return;
        }

        if (Math.abs(expected - amount) > 0.009) return;

        String bankName = resolveApplicationLabel(sbn.getPackageName());
        prefs.edit()
                .putString(KEY_LAST_AMOUNT, String.format(Locale.US, "%.2f", amount))
                .putLong(KEY_LAST_TIMESTAMP, postedAt)
                .putString(KEY_LAST_BANK, bankName)
                .putString(KEY_LAST_PACKAGE, sbn.getPackageName())
                .putString(KEY_LAST_TEXT, text)
                .apply();
    }

    private String extractNotificationText(Notification notification) {
        if (notification == null || notification.extras == null) return "";
        List<String> parts = new ArrayList<>();
        CharSequence title = notification.extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence text = notification.extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigText = notification.extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (title != null) parts.add(title.toString());
        if (text != null) parts.add(text.toString());
        if (bigText != null) parts.add(bigText.toString());
        CharSequence[] lines = notification.extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
        if (lines != null) {
            for (CharSequence line : lines) {
                if (line != null) parts.add(line.toString());
            }
        }
        return TextUtils.join(" · ", parts);
    }

    private String normalize(String value) {
        return value
                .toLowerCase(Locale.ROOT)
                .replace("á", "a").replace("à", "a").replace("ã", "a").replace("â", "a")
                .replace("é", "e").replace("ê", "e").replace("í", "i")
                .replace("ó", "o").replace("ô", "o").replace("õ", "o")
                .replace("ú", "u").replace("ç", "c");
    }

    private boolean looksLikeReceivedPix(String normalized) {
        boolean pix = normalized.contains("pix");
        boolean received = normalized.contains("recebid")
                || normalized.contains("recebimento")
                || normalized.contains("credito recebido")
                || normalized.contains("pagamento recebido")
                || normalized.contains("transferencia recebida");
        return pix && received;
    }

    private Double extractAmount(String text) {
        Matcher matcher = MONEY.matcher(text);
        while (matcher.find()) {
            String raw = matcher.group(1);
            if (raw == null) continue;
            String normalized = raw.replace(".", "").replace(",", ".");
            try {
                return Double.parseDouble(normalized);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private String resolveApplicationLabel(String packageName) {
        try {
            CharSequence label = getPackageManager()
                    .getApplicationLabel(getPackageManager().getApplicationInfo(packageName, 0));
            return label != null ? label.toString() : packageName;
        } catch (Exception e) {
            return packageName;
        }
    }
}
