package de.tutao.tutanota;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ClipData;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.MailTo;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.annotation.RequiresPermission;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.text.TextUtils;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.jdeferred.Deferred;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

import de.tutao.tutanota.push.PushNotificationService;
import de.tutao.tutanota.push.SseStorage;

public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    public static final String THEME_PREF = "theme";
    private static HashMap<Integer, Deferred> requests = new HashMap<>();
    private static int requestId = 0;
    private static final String ASKED_BATTERY_OPTIMIZTAIONS_PREF = "askedBatteryOptimizations";
    public static final String OPEN_USER_MAILBOX_ACTION = "de.tutao.tutanota.OPEN_USER_MAILBOX_ACTION";
    public static final String OPEN_USER_MAILBOX_MAILADDRESS_KEY = "mailAddress";
    public static final String OPEN_USER_MAILBOX_USERID_KEY = "userId";

    private WebView webView;
    public Native nativeImpl = new Native(this);
    boolean firstLoaded = false;

    @SuppressLint({"SetJavaScriptEnabled", "StaticFieldLeak"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        doChangeTheme(PreferenceManager.getDefaultSharedPreferences(this)
                .getString(THEME_PREF, "light"));

        super.onCreate(savedInstanceState);

        this.setupPushNotifications();

        webView = new WebView(this);
        webView.setBackgroundColor(getResources().getColor(android.R.color.transparent));
        setContentView(webView);
        final String appUrl = getUrl();
        if (BuildConfig.DEBUG) {
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

        List<String> queryParameters = new ArrayList<>();

        // If opened from notifications, tell Web app to not login automatically, we will pass
        // mailbox later when loaded (in handleIntent())
        if (getIntent() != null && OPEN_USER_MAILBOX_ACTION.equals(getIntent().getAction())) {
            queryParameters.add("noAutoLogin=true");
        }

        // If the old credentials are present in the file system, pass them as an URL parameter
        final File oldCredentialsFile = new File(getFilesDir(), "config/tutanota.json");
        if (oldCredentialsFile.exists()) {
            new AsyncTask<Void, Void, String>() {
                @Override
                @Nullable
                protected String doInBackground(Void... voids) {
                    try {
                        String result = Utils.base64ToBase64Url(
                                Utils.bytesToBase64(Utils.readFile(oldCredentialsFile)));
                        oldCredentialsFile.delete();
                        return result;
                    } catch (IOException e) {
                        return null;
                    }
                }

                @Override
                protected void onPostExecute(@Nullable String s) {
                    if (s != null) {
                        queryParameters.add("migrateCredentials=" + s);
                    }
                    startWebApp(queryParameters);
                }
            }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
        } else {
            startWebApp(queryParameters);
        }
    }

    private void startWebApp(List<String> queryParams) {
        webView.loadUrl(getUrl() +
                (queryParams.isEmpty() ? "" : "?" + TextUtils.join("&", queryParams)));
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
                case Intent.ACTION_VIEW:
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

    public void changeTheme(String themeName) {
        runOnUiThread(() -> doChangeTheme(themeName));
    }

    private void doChangeTheme(String themeName) {
        int elemsColor;
        int backgroundRes;
        switch (themeName) {
            case "dark":
                elemsColor = R.color.colorPrimaryDark;
                backgroundRes = R.drawable.splash_background_dark;
                break;
            default:
                elemsColor = R.color.colorPrimary;
                backgroundRes = R.drawable.splash_background;
        }
        int colorInt = getResources().getColor(elemsColor);
        getWindow().setStatusBarColor(colorInt);
        getWindow().setBackgroundDrawableResource(backgroundRes);
        PreferenceManager.getDefaultSharedPreferences(this)
                .edit()
                .putString(THEME_PREF, themeName)
                .apply();
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
        Deferred<Void, Exception, Void> p = new DeferredObject<>();
        if (hasPermission(permission)) {
            p.resolve(null);
        } else {
            int requestCode = getRequestCode();
            requests.put(requestCode, p);
            ActivityCompat.requestPermissions(this, new String[]{permission}, requestCode);
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
                new SseStorage(this).getSseInfo(), "MainActivity#setupPushNotifications"));

        JobScheduler jobScheduler = (JobScheduler) getSystemService(Context.JOB_SCHEDULER_SERVICE);
        //noinspection ConstantConditions
        jobScheduler.schedule(
                new JobInfo.Builder(1, new ComponentName(this, PushNotificationService.class))
                        .setPeriodic(TimeUnit.MINUTES.toMillis(15))
                        .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                        .setPersisted(true).build());
    }

    /**
     * The sharing activity. Either invoked from MainActivity (if the app was not active when the
     * share occured) or from onCreate.
     */
    void share(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();
        ClipData clipData = intent.getClipData();

        JSONArray files;
        String text = null;
        String[] addresses = intent.getStringArrayExtra(Intent.EXTRA_EMAIL);
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);

        if (Intent.ACTION_SEND.equals(action)) {
            if (type != null && type.startsWith("text")) {
                if (clipData != null && clipData.getItemCount() > 0) {
                    text = clipData.getItemAt(0).getHtmlText();
                    if (text == null) {
                        text = clipData.getItemAt(0).getText().toString();
                    }
                } else {
                    text = intent.getStringExtra(Intent.EXTRA_TEXT);
                }
                files = new JSONArray();
            } else {
                files = getFilesFromIntent(intent);

            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            files = getFilesFromIntent(intent);
        } else {
            files = new JSONArray();
        }

        final String mailToUrlString;
        if (intent.getData() != null && MailTo.isMailTo(intent.getDataString())) {
            mailToUrlString = intent.getDataString();
        } else {
            mailToUrlString = null;
        }

        JSONArray jsonAddresses = null;
        if (addresses != null) {
            jsonAddresses = new JSONArray();
            for (String address : addresses) {
                jsonAddresses.put(address);
            }
        }
        nativeImpl.sendRequest(JsRequest.createMailEditor,
                new Object[]{files, text, jsonAddresses, subject, mailToUrlString});
    }

    @NonNull
    private JSONArray getFilesFromIntent(@NonNull Intent intent) {
        ClipData clipData = intent.getClipData();
        final JSONArray filesArray = new JSONArray();
        if (clipData != null) {
            for (int i = 0; i < clipData.getItemCount(); i++) {
                ClipData.Item item = clipData.getItemAt(0);
                try {
                    filesArray.put(FileUtil.uriToFile(this, item.getUri()));
                } catch (FileNotFoundException e) {
                    Log.w(TAG, "Could not find file " + item.getUri());
                }
            }
        } else {
            // Intent documentation claims that data is copied to ClipData if it's not there
            // but we want to be sure
            if (Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction())) {
                //noinspection unchecked
                @SuppressWarnings("ConstantConditions")
                ArrayList<Uri> uris = (ArrayList<Uri>) intent.getExtras().get(Intent.EXTRA_STREAM);
                if (uris != null) {
                    for (Uri uri : uris) {
                        try {
                            filesArray.put(FileUtil.uriToFile(this, uri));
                        } catch (FileNotFoundException e) {
                            Log.w(TAG, "Could not find file " + uri);
                        }
                    }
                }
            } else if (intent.hasExtra(Intent.EXTRA_STREAM)) {
                Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                try {
                    filesArray.put(FileUtil.uriToFile(this, uri));
                } catch (FileNotFoundException e) {
                    Log.w(TAG, "Could not find file " + uri);
                }
            } else if (intent.getData() != null) {
                Uri uri = intent.getData();
                try {
                    filesArray.put(FileUtil.uriToFile(this, uri));
                } catch (FileNotFoundException e) {
                    Log.w(TAG, "Could not find file " + uri);
                }
            } else {
                Log.w(TAG, "Did not find files in the intent");
            }
        }
        return filesArray;
    }

    public void openMailbox(@NonNull Intent intent) {
        String userId = intent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY);
        String address = intent.getStringExtra(OPEN_USER_MAILBOX_MAILADDRESS_KEY);
        if (userId == null || address == null) {
            return;
        }
        nativeImpl.sendRequest(JsRequest.openMailbox, new Object[]{userId, address});
        startService(PushNotificationService.notificationDismissedIntent(this, address, "MainActivity#openMailbox"));
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