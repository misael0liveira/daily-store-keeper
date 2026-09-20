package app.minimarket.pos;

import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "PixNotification")
public class PixNotificationPlugin extends Plugin {
    private static final String PREFS = "pix_notification";
    private static final String KEY_EXPECTED_AMOUNT = "expected_amount";
    private static final String KEY_EXPECTED_SINCE = "expected_since";
    private static final String KEY_LAST_AMOUNT = "last_amount";
    private static final String KEY_LAST_TIMESTAMP = "last_timestamp";
    private static final String KEY_LAST_BANK = "last_bank";
    private static final String KEY_LAST_PACKAGE = "last_package";
    private static final String KEY_LAST_TEXT = "last_text";

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, 0);
    }

    @PluginMethod
    public void isNotificationAccessGranted(PluginCall call) {
        NotificationManager manager = (NotificationManager) getContext().getSystemService(NotificationManager.class);
        ComponentName component = new ComponentName(getContext(), PixNotificationListener.class);
        boolean granted = manager != null && manager.isNotificationListenerAccessGranted(component);
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        ComponentName component = new ComponentName(getContext(), PixNotificationListener.class);
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
            intent.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component.flattenToString());
        } else {
            intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Não foi possível abrir as configurações de notificações.", e);
        }
    }

    @PluginMethod
    public void setExpectedAmount(PluginCall call) {
        Double amount = call.getDouble("amount");
        if (amount == null || amount <= 0) {
            call.reject("Valor Pix inválido.");
            return;
        }
        prefs().edit()
                .putString(KEY_EXPECTED_AMOUNT, String.format(java.util.Locale.US, "%.2f", amount))
                .putLong(KEY_EXPECTED_SINCE, System.currentTimeMillis())
                .remove(KEY_LAST_AMOUNT)
                .remove(KEY_LAST_TIMESTAMP)
                .remove(KEY_LAST_BANK)
                .remove(KEY_LAST_PACKAGE)
                .remove(KEY_LAST_TEXT)
                .apply();
        call.resolve();
    }

    @PluginMethod
    public void clearExpectedAmount(PluginCall call) {
        prefs().edit()
                .remove(KEY_EXPECTED_AMOUNT)
                .remove(KEY_EXPECTED_SINCE)
                .remove(KEY_LAST_AMOUNT)
                .remove(KEY_LAST_TIMESTAMP)
                .remove(KEY_LAST_BANK)
                .remove(KEY_LAST_PACKAGE)
                .remove(KEY_LAST_TEXT)
                .apply();
        call.resolve();
    }

    @PluginMethod
    public void getLastPayment(PluginCall call) {
        SharedPreferences p = prefs();
        if (!p.contains(KEY_LAST_AMOUNT)) {
            JSObject result = new JSObject();
            result.put("found", false);
            call.resolve(result);
            return;
        }

        JSObject result = new JSObject();
        result.put("found", true);
        result.put("amount", Double.parseDouble(p.getString(KEY_LAST_AMOUNT, "0")));
        result.put("timestamp", p.getLong(KEY_LAST_TIMESTAMP, 0));
        result.put("bank", p.getString(KEY_LAST_BANK, "Banco não identificado"));
        result.put("packageName", p.getString(KEY_LAST_PACKAGE, ""));
        result.put("notificationText", p.getString(KEY_LAST_TEXT, ""));

        p.edit()
                .remove(KEY_LAST_AMOUNT)
                .remove(KEY_LAST_TIMESTAMP)
                .remove(KEY_LAST_BANK)
                .remove(KEY_LAST_PACKAGE)
                .remove(KEY_LAST_TEXT)
                .apply();
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        NotificationManager manager = (NotificationManager) getContext().getSystemService(NotificationManager.class);
        ComponentName component = new ComponentName(getContext(), PixNotificationListener.class);
        boolean granted = manager != null && manager.isNotificationListenerAccessGranted(component);
        JSObject result = new JSObject();
        result.put("enabled", granted);
        result.put("platform", "android");
        call.resolve(result);
    }
}
