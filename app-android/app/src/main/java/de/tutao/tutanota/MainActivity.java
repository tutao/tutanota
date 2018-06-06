package de.tutao.tutanota;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresPermission;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.ShareCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

import org.jdeferred.Deferred;
import org.jdeferred.DoneCallback;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;

import java.io.FileNotFoundException;
import java.util.HashMap;

import de.tutao.tutanota.push.GcmRegistrationService;

public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    private static int requestId = 0;
    private static HashMap<Integer, Deferred> requests = new HashMap<>();

    private WebView webView;
    public Native nativeImpl = new Native(this);
    boolean firstLoaded = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
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

        this.nativeImpl.getInitialized().then(new DoneCallback() {
            @Override
            public void onDone(Object result) {
                if (!firstLoaded) {
                    if (getIntent().getAction() != null) {
                        share(getIntent());
                    }
                }
                firstLoaded = false;
            }
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
        this.webView.loadUrl(appUrl);
        nativeImpl.setup();

    }

    @Override
    protected void onNewIntent(Intent intent) {
        if (intent.getAction() != null) {
            share(intent);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    private String getUrl() {
        switch (BuildConfig.BUILD_TYPE) {
            case "debug":
                return "http://" + BuildConfig.hostname.split("\\.")[0] + ":9000/client/build/app";
            case "debugDist":
                return "file:///android_asset/tutanota/app.html";
            default:
                throw new RuntimeException("illegal build type");
        }
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
        if (gcmIsAvailable()) {
            // gcm registration
            Intent intent = new Intent(MainActivity.this, GcmRegistrationService.class);
            startService(intent);
        }
    }

    /**
     * @return true, if the GCM is available.
     */
    private boolean gcmIsAvailable() {
        GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
        int resultCode = apiAvailability.isGooglePlayServicesAvailable(this);
        if (resultCode != ConnectionResult.SUCCESS) {
            return false;
        }
        return true;
    }

    public void bringToForeground() {
        Intent intent = new Intent(this, getClass());
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        getApplicationContext().startActivity(intent);
    }

    /**
     * The sharing activity. Either invoked from MainActivity (if the app was not active when the
     * share occured) or from onCreate.
     */
    void share(Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action)) {
            ShareCompat.IntentReader share = ShareCompat.IntentReader.from(this);
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

}

interface Callback<T> {
    void finish(Exception e, T result);
}

interface ActivityResultCallback {
    void finish(int resultCode, Intent data);
}

class ActivityResult {
    int resultCode;
    Intent data;

    ActivityResult(int resultCode, Intent data) {
        this.resultCode = resultCode;
        this.data = data;
    }
}