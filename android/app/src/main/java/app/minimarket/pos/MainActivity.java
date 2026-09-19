package app.minimarket.pos;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(AppUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
