package de.tutao.tutanota;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresPermission;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.ShareCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.jdeferred.Deferred;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.FileNotFoundException;
import java.util.HashMap;

import de.tutao.tutanota.push.PushNotificationService;
import de.tutao.tutanota.push.SseStorage;

public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    private static HashMap<Integer, Deferred> requests = new HashMap<>();
    private static int requestId = 0;
    private static final String ASKED_BATTERY_OPTIMIZTAIONS_PREF = "askedBatteryOptimizations";
    public static final String OPEN_USER_MAILBOX_ACTION = "de.tutao.tutanota.OPEN_USER_MAILBOX_ACTION";
    public static final String OPEN_USER_MAILBOX_MAILADDRESS_KEY = "mailAddress";
    public static final String OPEN_USER_MAILBOX_USERID_KEY = "userId";


    private WebView webView;
    public Native nativeImpl = new Native(this);
    boolean firstLoaded = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.setupPushNotifications();

        webView = new WebView(this);
        webView.setBackgroundColor(getResources().getColor(android.R.color.transparent));
        setContentView(webView);
        final String appUrl = getUrl();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && BuildConfig.BUILD_TYPE.startsWith("debug")) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setAllowUniversalAccessFromFileURLs(true);

        this.nativeImpl.getWebAppInitialized().then(result -> {
            if (!firstLoaded) {
                handleIntent(getIntent());
            }
            firstLoaded = true;
        });
        this.webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith(appUrl)) {
                    return false;
                }
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }
        });

        // avoid auto login if launched from notification message
        String loadUrl = appUrl;
        if (getIntent() != null && OPEN_USER_MAILBOX_ACTION.equals(getIntent().getAction())) {
            loadUrl = appUrl + "?noAutoLogin=true";
        }
        this.webView.loadUrl(loadUrl);
        nativeImpl.setup();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent.getAction() != null) {
            switch (intent.getAction()) {
                case Intent.ACTION_SEND:
                case Intent.ACTION_SEND_MULTIPLE:
                    share(intent);
                    break;
                case MainActivity.OPEN_USER_MAILBOX_ACTION:
                    openMailbox(intent);
                    break;
            }
        }
    }


    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    public void askBatteryOptinmizationsIfNeeded() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(this);
        //noinspection ConstantConditions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !preferences.getBoolean(ASKED_BATTERY_OPTIMIZTAIONS_PREF, false)
                && !powerManager.isIgnoringBatteryOptimizations(getPackageName())) {
            nativeImpl.sendRequest(JsRequest.showAlertDialog, new Object[]{"allowPushNotification_msg"}).then((result) -> {
                saveAskedBatteryOptimizations(preferences);
                @SuppressLint("BatteryLife")
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                        Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            });
        }
    }

    private void saveAskedBatteryOptimizations(SharedPreferences preferences) {
        preferences.edit().putBoolean(ASKED_BATTERY_OPTIMIZTAIONS_PREF, true).apply();
    }

    private String getUrl() {
        return BuildConfig.RES_ADDRESS;
    }

    public WebView getWebView() {
        return webView;
    }

    private static synchronized int getRequestCode() {
        requestId++;
        if (requestId < 0) {
            requestId = 0;
        }
        return requestId;
    }

    Promise<Void, Exception, Void> getPermission(String permission) {
        Deferred p = new DeferredObject();
        if (hasPermission(permission)) {
            p.resolve(null);
        } else {
            int requestCode = getRequestCode();
            ActivityCompat.requestPermissions(this, new String[]{permission}, requestCode);
            requests.put(requestCode, p);
        }
        return p;
    }

    private boolean hasPermission(String permission) {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (grantResults.length == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            requests.remove(requestCode).resolve(null);
        } else {
            requests.remove(requestCode).reject(new SecurityException("Permission missing"));
        }
    }

    public Promise<ActivityResult, ?, ?> startActivityForResult(@RequiresPermission Intent intent) {
        int requestCode = getRequestCode();
        super.startActivityForResult(intent, requestCode);
        Deferred p = new DeferredObject();
        requests.put(requestCode, p);
        return p;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        Deferred p = requests.remove(requestCode);
        p.resolve(new ActivityResult(resultCode, data));
    }

    void setupPushNotifications() {
        startService(PushNotificationService.startIntent(this,
                new SseStorage(this).getSseInfo()));
    }

    /**
     * The sharing activity. Either invoked from MainActivity (if the app was not active when the
     * share occured) or from onCreate.
     */
    void share(Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action)) {
            try {
                final String file;
                ClipData clipData = intent.getClipData();
                if (clipData != null) {
                    ClipData.Item item = clipData.getItemAt(0);
                    file = FileUtil.uriToFile(this, item.getUri());
                } else {
                    Uri uri = intent.getData();
                    file = FileUtil.uriToFile(this, uri);
                }
                final JSONArray filesArray = new JSONArray();
                filesArray.put(file);
                nativeImpl.sendRequest(JsRequest.createMailEditor, new Object[]{filesArray});
            } catch (FileNotFoundException e) {
                Log.e(TAG, "could not find file", e);
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            // TODO
        }
    }

    public void openMailbox(@NonNull Intent intent) {
        String userId = intent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY);
        String address = intent.getStringExtra(OPEN_USER_MAILBOX_MAILADDRESS_KEY);
        if (userId == null || address == null) {
            return;
        }
        nativeImpl.sendRequest(JsRequest.openMailbox, new Object[]{userId, address});
    }

    @Override

    public void onBackPressed() {
        if (nativeImpl.getWebAppInitialized().isResolved()) {
            nativeImpl.sendRequest(JsRequest.handleBackPress, new Object[0])
                    .then(result -> {
                        try {
                            if (!result.getBoolean("value")) {
                                goBack();
                            }
                        } catch (JSONException e) {
                            Log.e(TAG, "error parsing response", e);
                        }
                    });
        } else {
            goBack();
        }
    }

    private void goBack() {
        moveTaskToBack(false);
    }

    public void loadMainPage(String parameters) {
        // additional path information like app.html/login are not handled properly by the webview
        // when loaded from local file system. so we are just adding parameters to the Url e.g. ../app.html?noAutoLogin=true.
        runOnUiThread(() -> this.webView.loadUrl(getUrl() + parameters));
    }
}

class ActivityResult {
    int resultCode;
    Intent data;

    ActivityResult(int resultCode, Intent data) {
        this.resultCode = resultCode;
        this.data = data;
    }
}