package de.tutao.tutanota;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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
import android.text.TextUtils;
import android.util.Log;
import android.view.ContextMenu;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.ColorRes;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresPermission;
import androidx.core.app.ActivityCompat;
import androidx.core.app.ComponentActivity;
import androidx.core.content.ContextCompat;

import org.jdeferred.Deferred;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import de.tutao.tutanota.alarms.AlarmNotificationsManager;
import de.tutao.tutanota.alarms.SystemAlarmFacade;
import de.tutao.tutanota.data.AppDatabase;
import de.tutao.tutanota.push.LocalNotificationsFacade;
import de.tutao.tutanota.push.PushNotificationService;
import de.tutao.tutanota.push.SseStorage;

public class MainActivity extends ComponentActivity {

	private static final String TAG = "MainActivity";
	public static final String THEME_PREF = "theme";
	public static final String INVALIDATE_SSE_ACTION = "de.tutao.tutanota.INVALIDATE_SSE";
	private static Map<Integer, Deferred> requests = new ConcurrentHashMap<>();
	private static int requestId = 0;
	private static final String ASKED_BATTERY_OPTIMIZTAIONS_PREF = "askedBatteryOptimizations";
	public static final String OPEN_USER_MAILBOX_ACTION = "de.tutao.tutanota.OPEN_USER_MAILBOX_ACTION";
	public static final String OPEN_CALENDAR_ACTION = "de.tutao.tutanota.OPEN_CALENDAR_ACTION";
	public static final String OPEN_USER_MAILBOX_MAILADDRESS_KEY = "mailAddress";
	public static final String OPEN_USER_MAILBOX_USERID_KEY = "userId";
	public static final String IS_SUMMARY_EXTRA = "isSummary";

	private WebView webView;
	public SseStorage sseStorage;
	public Native nativeImpl;
	boolean firstLoaded = false;

	@SuppressLint({"SetJavaScriptEnabled", "StaticFieldLeak"})
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		Log.d(TAG, "App started");
		doChangeTheme(PreferenceManager.getDefaultSharedPreferences(this)
				.getString(THEME_PREF, "light"));

		AndroidKeyStoreFacade keyStoreFacade = new AndroidKeyStoreFacade(this);
		sseStorage = new SseStorage(AppDatabase.getDatabase(this, /*allowMainThreadAccess*/false),
				keyStoreFacade);
		AlarmNotificationsManager alarmNotificationsManager = new AlarmNotificationsManager(keyStoreFacade, sseStorage,
				new Crypto(this), new SystemAlarmFacade(this), new LocalNotificationsFacade(this));
		nativeImpl = new Native(this, sseStorage, alarmNotificationsManager);

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
		// Reject cookies by external content
		CookieManager.getInstance().setAcceptCookie(false);
		CookieManager.getInstance().removeAllCookies(null);

		this.nativeImpl.getWebAppInitialized().then(result -> {
			if (!firstLoaded) {
				handleIntent(getIntent());
			}
			firstLoaded = true;

			webView.post(() -> { // use webView.post to switch to main thread again to be able to observe sseStorage
				sseStorage.observeUsers().observe(this, (userInfos) -> {
					if (userInfos.isEmpty()) {
						Log.d(TAG, "invalidateAlarms");
						nativeImpl.sendRequest(JsRequest.invalidateAlarms, new Object[]{});
					}
				});
			});
		});

		this.webView.setWebViewClient(new WebViewClient() {
			@Override
			public boolean shouldOverrideUrlLoading(WebView view, String url) {
				if (url.startsWith(appUrl)) {
					// Set JS interface on page reload
					nativeImpl.setup();
					return false;
				}

				Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
				try {
					startActivity(intent);
				} catch (ActivityNotFoundException e) {
					Toast.makeText(MainActivity.this, "Could not open link: " + url, Toast.LENGTH_SHORT)
							.show();
				}
				return true;
			}

		});

		// Handle long click on links in the WebView
		this.registerForContextMenu(this.webView);

		List<String> queryParameters = new ArrayList<>();

		// If opened from notifications, tell Web app to not login automatically, we will pass
		// mailbox later when loaded (in handleIntent())
		if (getIntent() != null
				&& (OPEN_USER_MAILBOX_ACTION.equals(getIntent().getAction()) || OPEN_CALENDAR_ACTION.equals(getIntent().getAction()))) {
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

		IntentFilter filter = new IntentFilter(INVALIDATE_SSE_ACTION);
		this.registerReceiver(new BroadcastReceiver() {
			@Override
			public void onReceive(Context context, Intent intent) {

			}
		}, filter);
	}

	@Override
	protected void onStart() {
		super.onStart();
		Log.d(TAG, "onStart");
		nativeImpl.getWebAppInitialized().then(__ -> {
			nativeImpl.sendRequest(JsRequest.visibilityChange, new Object[]{true});
		});
	}

	@Override
	protected void onStop() {
		Log.d(TAG, "onStop");
		nativeImpl.getWebAppInitialized().then(__ -> {
			nativeImpl.sendRequest(JsRequest.visibilityChange, new Object[]{false});
		});
		super.onStop();
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

		// When we redirect to the app from outside, for example after doing payment verification,
		// we don't want to do any kind of intent handling
		Uri data = intent.getData();
		if (data != null && data.toString().startsWith("tutanota://")) {
			return;
		}

		if (intent.getAction() != null) {
			switch (intent.getAction()) {
				// See descriptions of actions in AndroidManifest.xml
				case Intent.ACTION_SEND:
				case Intent.ACTION_SEND_MULTIPLE:
				case Intent.ACTION_SENDTO:
				case Intent.ACTION_VIEW:
					share(intent);
					break;
				case MainActivity.OPEN_USER_MAILBOX_ACTION:
					openMailbox(intent);
					break;
				case MainActivity.OPEN_CALENDAR_ACTION:
					openCalendar(intent);
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
		boolean isDark = "dark".equals(themeName);
		@ColorRes int backgroundRes = isDark ? R.color.darkDarkest : R.color.white;
		getWindow().setBackgroundDrawableResource(backgroundRes);
		View decorView = getWindow().getDecorView();

		if (Utils.atLeastOreo()) {
			int navbarColor = ContextCompat.getColor(this, isDark ? R.color.darkLighter : R.color.white);
			getWindow().setNavigationBarColor(navbarColor);
			decorView.setSystemUiVisibility(isDark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
		}

		// Changing status bar color
		// Before Android M there was no flag to use lightStatusBar (so that text is white or
		// black). As our primary color is red, Android thinks that the status bar color text
		// should be white. So we cannot use white status bar color.
		// So for Android M and above we alternate between white and dark status bar colors and
		// we change lightStatusBar flag accordingly.
		int statusBarColorInt;
		int uiFlags = isDark
				? decorView.getSystemUiVisibility() & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
				: decorView.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
		decorView.setSystemUiVisibility(uiFlags);
		statusBarColorInt = getResources().getColor(isDark ? R.color.darkLighter : R.color.white, null);
		getWindow().setStatusBarColor(statusBarColorInt);
		PreferenceManager.getDefaultSharedPreferences(this)
				.edit()
				.putString(THEME_PREF, themeName)
				.apply();
	}

	public void askBatteryOptinmizationsIfNeeded() {
		PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
		SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(this);
		if (!preferences.getBoolean(ASKED_BATTERY_OPTIMIZTAIONS_PREF, false)
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
		Deferred deferred = requests.remove(requestCode);
		if (deferred == null) {
			Log.w(TAG, "No deferred for the permission request" + requestCode);
			return;
		}
		if (grantResults.length == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
			deferred.resolve(null);
		} else {
			deferred.reject(new SecurityException("Permission missing: " + Arrays.toString(permissions)));
		}
	}

	public Promise<ActivityResult, ?, ?> startActivityForResult(@RequiresPermission Intent intent) {
		int requestCode = getRequestCode();
		Deferred p = new DeferredObject();
		requests.put(requestCode, p);
		super.startActivityForResult(intent, requestCode);
		return p;
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		Deferred deferred = requests.remove(requestCode);
		if (deferred != null) {
			deferred.resolve(new ActivityResult(resultCode, data));
		} else {

			Log.w(TAG, "No deferred for activity request" + requestCode);
		}
	}

	void setupPushNotifications() {
		startService(PushNotificationService.startIntent(this, "MainActivity#setupPushNotifications"));

		JobScheduler jobScheduler = (JobScheduler) getSystemService(Context.JOB_SCHEDULER_SERVICE);
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
			// Try to read text from the clipboard before fall back on intent.getStringExtra
			if (clipData != null && clipData.getItemCount() > 0) {
				if (clipData.getDescription().getMimeType(0).startsWith("text")) {
					text = clipData.getItemAt(0).getHtmlText();
				}
				if (text == null && clipData.getItemAt(0).getText() != null) {
					text = clipData.getItemAt(0).getText().toString();
				}
			}
			if (text == null) {
				text = intent.getStringExtra(Intent.EXTRA_TEXT);
			}
			files = getFilesFromIntent(intent);
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
		Promise<Void, Exception, Void> permissionPromise;
		if (files.length() > 0) {
			permissionPromise = this.getPermission(Manifest.permission.READ_EXTERNAL_STORAGE);
		} else {
			permissionPromise = new DeferredObject<Void, Exception, Void>().resolve(null);
		}

		// Satisfy Java's lambda requirements
		final String fText = text;
		final JSONArray fJsonAddresses = jsonAddresses;
		permissionPromise.then((__) -> {
			nativeImpl.sendRequest(JsRequest.createMailEditor,
					new Object[]{files, fText, fJsonAddresses, subject, mailToUrlString});
		});
	}

	@NonNull
	private JSONArray getFilesFromIntent(@NonNull Intent intent) {
		ClipData clipData = intent.getClipData();
		final JSONArray filesArray = new JSONArray();
		if (clipData != null) {
			for (int i = 0; i < clipData.getItemCount(); i++) {
				ClipData.Item item = clipData.getItemAt(i);
				Uri uri = item.getUri();
				if (uri != null) {
					filesArray.put(uri.toString());
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
						filesArray.put(uri.toString());
					}
				}
			} else if (intent.hasExtra(Intent.EXTRA_STREAM)) {
				Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
				filesArray.put(uri.toString());
			} else if (intent.getData() != null) {
				Uri uri = intent.getData();
				filesArray.put(uri.toString());
			} else {
				Log.w(TAG, "Did not find files in the intent");
			}
		}
		return filesArray;
	}

	public void openMailbox(@NonNull Intent intent) {
		String userId = intent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY);
		String address = intent.getStringExtra(OPEN_USER_MAILBOX_MAILADDRESS_KEY);
		boolean isSummary = intent.getBooleanExtra(IS_SUMMARY_EXTRA, false);
		if (userId == null || address == null) {
			return;
		}
		nativeImpl.sendRequest(JsRequest.openMailbox, new Object[]{userId, address});
		ArrayList<String> addressess = new ArrayList<>(1);
		addressess.add(address);
		startService(LocalNotificationsFacade.notificationDismissedIntent(this, addressess,
				"MainActivity#openMailbox", isSummary));
	}

	public void openCalendar(@NonNull Intent intent) {
		String userId = intent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY);
		if (userId == null) {
			return;
		}
		nativeImpl.sendRequest(JsRequest.openCalendar, new Object[]{userId});
	}

	@Override

	public void onBackPressed() {
		if (nativeImpl.getWebAppInitialized().isResolved()) {
			nativeImpl.sendRequest(JsRequest.handleBackPress, new Object[0])
					.then(result -> {
						try {
							if (!((JSONObject) result).getBoolean("value")) {
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

	@Override
	public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
		super.onCreateContextMenu(menu, v, menuInfo);

		final WebView.HitTestResult hitTestResult = this.webView.getHitTestResult();
		switch (hitTestResult.getType()) {
			case WebView.HitTestResult.SRC_ANCHOR_TYPE:
				final String link = hitTestResult.getExtra();
				if (link == null) {
					return;
				}
				if (link.startsWith(getUrl())) {
					return;
				}
				menu.setHeaderTitle(link);
				menu.add(0, 0, 0, "Copy link").setOnMenuItemClickListener(item -> {
					((ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE))
							.setPrimaryClip(ClipData.newPlainText(link, link));
					return true;
				});
				menu.add(0, 2, 0, "Share").setOnMenuItemClickListener(item -> {
					final Intent intent = new Intent(Intent.ACTION_SEND);
					intent.putExtra(Intent.EXTRA_TEXT, link);
					intent.setTypeAndNormalize("text/plain");
					this.startActivity(Intent.createChooser(intent, "Share link"));
					return true;
				});
				break;
		}
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
