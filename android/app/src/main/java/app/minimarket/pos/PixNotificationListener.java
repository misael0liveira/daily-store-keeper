package app.minimarket.pos;

import android.app.Notification;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class PixNotificationListener extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getPackageName() == null || sbn.getPackageName().equals(getPackageName())) return;
        Notification notification = sbn.getNotification();
        if (notification == null || (notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        synchronized (PaymentNotificationState.LOCK) {
            SharedPreferences prefs = getSharedPreferences(PaymentNotificationState.PREFS, MODE_PRIVATE);
            String expectedRaw = prefs.getString("expected_amount", "");
            String monitorId = prefs.getString("expected_monitor", "");
            if (TextUtils.isEmpty(expectedRaw) || TextUtils.isEmpty(monitorId)) return;
            long since = prefs.getLong("expected_since", 0);
            long postedAt = sbn.getPostTime();
            if (postedAt < since || (notification.when > 0 && notification.when < since)) return;
            // Expire a monitor left behind by a closed or interrupted WebView.
            if (postedAt - since > 15 * 60 * 1000L) return;
            String method = prefs.getString("expected_method", "pix");
            Long amount;
            try {
                long cents = new java.math.BigDecimal(expectedRaw).movePointRight(2).longValueExact();
                amount = PaymentNotificationMatcher.match(sbn.getPackageName(), extractNotificationText(notification), method, cents);
            } catch (ArithmeticException | NumberFormatException e) { return; }
            if (amount == null) return;
            String eventId = sbn.getKey() + ":" + (notification.when > 0 ? notification.when : postedAt);
            List<String> consumed;
            try {
                org.json.JSONArray saved = new org.json.JSONArray(prefs.getString("consumed_events", "[]"));
                consumed = new ArrayList<>();
                for (int i = 0; i < saved.length(); i++) consumed.add(saved.getString(i));
            } catch (org.json.JSONException e) { return; }
            if (consumed.contains(eventId) || prefs.contains("last_amount")) return;
            consumed.add(eventId);
            while (consumed.size() > 64) consumed.remove(0);
            String bankName = PaymentNotificationMatcher.isCardProvider(sbn.getPackageName())
                    ? PaymentNotificationMatcher.providerName(sbn.getPackageName()) : resolveApplicationLabel(sbn.getPackageName());
            prefs.edit().putString("last_amount", String.format(Locale.US, "%.2f", amount / 100.0))
                    .putLong("last_timestamp", postedAt).putString("last_bank", bankName)
                    .putString("last_package", sbn.getPackageName()).putString("last_monitor", monitorId)
                    .putString("last_method", method).putString("consumed_events", new org.json.JSONArray(consumed).toString())
                    .apply();
        }
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
