package app.minimarket.pos;

import android.content.SharedPreferences;

final class PaymentNotificationState {
    static final String PREFS = "pix_notification";
    static final Object LOCK = new Object();
    static void removeLast(SharedPreferences.Editor editor) {
        editor.remove("last_amount").remove("last_timestamp").remove("last_bank")
                .remove("last_package").remove("last_text").remove("last_monitor").remove("last_method");
    }
    static void clear(SharedPreferences prefs) {
        SharedPreferences.Editor editor = prefs.edit().remove("expected_amount").remove("expected_since")
                .remove("expected_method").remove("expected_monitor");
        removeLast(editor);
        editor.apply();
    }
}
