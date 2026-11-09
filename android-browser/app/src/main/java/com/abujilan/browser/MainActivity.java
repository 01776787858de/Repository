package com.abujilan.browser;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.net.Uri;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.mozilla.geckoview.ContentBlocking;
import org.mozilla.geckoview.GeckoRuntime;
import org.mozilla.geckoview.GeckoRuntimeSettings;
import org.mozilla.geckoview.GeckoSession;
import org.mozilla.geckoview.GeckoView;

import java.util.Locale;

public class MainActivity extends Activity {
    private static GeckoRuntime runtime;
    private GeckoSession session;
    private GeckoView browserView;
    private EditText address;
    private TextView protectionStatus;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(9, 17, 31));
        getWindow().setNavigationBarColor(Color.rgb(9, 17, 31));

        if (runtime == null) {
            ContentBlocking.Settings blocking = new ContentBlocking.Settings.Builder()
                .cookieBehavior(ContentBlocking.CookieBehavior.ACCEPT_FIRST_PARTY_AND_ISOLATE_OTHERS)
                .cookieBehaviorPrivateMode(ContentBlocking.CookieBehavior.ACCEPT_FIRST_PARTY_AND_ISOLATE_OTHERS)
                .antiTracking(
                    ContentBlocking.AntiTracking.AD
                    | ContentBlocking.AntiTracking.ANALYTIC
                    | ContentBlocking.AntiTracking.SOCIAL
                    | ContentBlocking.AntiTracking.CONTENT
                    | ContentBlocking.AntiTracking.CRYPTOMINING
                    | ContentBlocking.AntiTracking.FINGERPRINTING
                    | ContentBlocking.AntiTracking.STP
                )
                .enhancedTrackingProtectionLevel(ContentBlocking.EtpLevel.STRICT)
                .enhancedTrackingProtectionCategory(ContentBlocking.EtpCategory.STRICT)
                .strictSocialTrackingProtection(true)
                .cookiePurging(true)
                .queryParameterStrippingEnabled(true)
                .build();

            GeckoRuntimeSettings settings = new GeckoRuntimeSettings.Builder()
                .contentBlocking(blocking)
                .build();
            runtime = GeckoRuntime.create(getApplicationContext(), settings);
        }

        session = new GeckoSession();
        session.open(runtime);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(12, 12, 12, 8);
        root.setBackgroundColor(Color.rgb(9, 17, 31));

        TextView title = new TextView(this);
        title.setText("🛡️ Abu Jilan Browser");
        title.setTextColor(Color.WHITE);
        title.setTextSize(21);
        title.setPadding(4, 8, 4, 12);
        root.addView(title);

        LinearLayout addressBar = new LinearLayout(this);
        addressBar.setOrientation(LinearLayout.HORIZONTAL);
        address = new EditText(this);
        address.setSingleLine(true);
        address.setHint("اكتب رابط الموقع");
        address.setTextColor(Color.WHITE);
        address.setHintTextColor(0xff9aabc2);
        address.setSelectAllOnFocus(true);
        address.setImeOptions(EditorInfo.IME_ACTION_GO);
        addressBar.addView(address, new LinearLayout.LayoutParams(0, dp(50), 1));

        Button go = makeButton("اذهب");
        addressBar.addView(go, new LinearLayout.LayoutParams(dp(72), dp(50)));
        root.addView(addressBar);

        LinearLayout controls = new LinearLayout(this);
        controls.setOrientation(LinearLayout.HORIZONTAL);
        Button back = makeButton("رجوع");
        Button forward = makeButton("تقدم");
        Button reload = makeButton("تحديث");
        controls.addView(back, new LinearLayout.LayoutParams(0, dp(44), 1));
        controls.addView(forward, new LinearLayout.LayoutParams(0, dp(44), 1));
        controls.addView(reload, new LinearLayout.LayoutParams(0, dp(44), 1));
        root.addView(controls);

        protectionStatus = new TextView(this);
        protectionStatus.setText("🛡️ حماية التتبّع والإعلانات المعروفة: مفعّلة (Strict)");
        protectionStatus.setTextColor(0xff79dfb4);
        protectionStatus.setPadding(4, 8, 4, 8);
        root.addView(protectionStatus);

        browserView = new GeckoView(this);
        browserView.setSession(session);
        root.addView(browserView, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1
        ));

        setContentView(root);

        go.setOnClickListener(v -> loadAddress());
        address.setOnEditorActionListener((v, action, event) -> {
            if (action == EditorInfo.IME_ACTION_GO) {
                loadAddress();
                return true;
            }
            return false;
        });
        back.setOnClickListener(v -> session.goBack());
        forward.setOnClickListener(v -> session.goForward());
        reload.setOnClickListener(v -> session.reload());

        session.setProgressDelegate(new GeckoSession.ProgressDelegate() {
            @Override
            public void onPageStart(GeckoSession current, String url) {
                runOnUiThread(() -> address.setText(url));
            }

            @Override
            public void onPageStop(GeckoSession current, boolean success) {
                runOnUiThread(() -> {
                    String currentUrl = current.getUri();
                    if (currentUrl != null) address.setText(currentUrl);
                });
            }
        });

        if (state == null) session.loadUri("https://example.com");
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private Button makeButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setAllCaps(false);
        return button;
    }

    private void loadAddress() {
        String value = address.getText().toString().trim();
        if (value.isEmpty()) return;
        if (!value.matches("(?i)^https?://.*")) value = "https://" + value;
        Uri uri = Uri.parse(value);
        if (("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                && uri.getHost() != null) {
            session.loadUri(value);
        } else {
            Toast.makeText(this, "الرابط غير صالح", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (session != null) session.setActive(true);
    }

    @Override
    protected void onPause() {
        if (session != null) session.setActive(false);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (browserView != null) browserView.releaseSession();
        if (session != null) session.close();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (session != null) session.goBack();
        else super.onBackPressed();
    }
}
