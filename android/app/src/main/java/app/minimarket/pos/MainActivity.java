package app.minimarket.pos;

import android.os.Bundle;
import android.view.Window;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void applySystemBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        // SystemBars keeps the current application theme; do not overwrite it on resume.
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        registerPlugin(AppUpdaterPlugin.class);
        registerPlugin(PixNotificationPlugin.class);
        super.onCreate(savedInstanceState);
        // The branded opening lives in AppStartup; avoid a second native logo or exit fade.
        splashScreen.setOnExitAnimationListener(provider -> provider.remove());
        applySystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBars();
    }
}
