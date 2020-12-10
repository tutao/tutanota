package de.tutao.tutanota;

import android.app.NotificationManager;
import android.content.ClipData;
import android.content.ContentProvider;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.util.Log;
import android.webkit.JavascriptInterface;

import androidx.annotation.Nullable;
import androidx.core.content.FileProvider;

import org.jdeferred.Deferred;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import de.tutao.tutanota.push.LocalNotificationsFacade;
import de.tutao.tutanota.push.SseStorage;

/**
 * Created by mpfau on 4/8/17.
 */
public final class Native {
	private static final String JS_NAME = "nativeApp";
	private final static String TAG = "Native";

	private static int requestId = 0;
	private Crypto crypto;
	private FileUtil files;
	private Contact contact;
	private SseStorage sseStorage;
	private Map<String, DeferredObject<Object, Exception, Void>> queue = new HashMap<>();
	private final MainActivity activity;
	private volatile DeferredObject<Void, Throwable, Void> webAppInitialized = new DeferredObject<>();


	Native(MainActivity activity, SseStorage sseStorage) {
		this.activity = activity;
		crypto = new Crypto(activity);
		contact = new Contact(activity);
		files = new FileUtil(activity);
		this.sseStorage = sseStorage;
	}

	public void setup() {
		activity.getWebView().addJavascriptInterface(this, JS_NAME);
	}

	/**
	 * Invokes method with args. The returned response is a JSON of the following format:
	 *
	 * @param msg A request (see WorkerProtocol)
	 */
	@JavascriptInterface
	public void invoke(final String msg) {
		new Thread(() -> {
			try {
				final JSONObject request = new JSONObject(msg);
				if (request.get("type").equals("response")) {
					String id = request.getString("id");
					DeferredObject<Object, Exception, Void> promise = queue.remove(id);
					if (promise == null) {
						Log.w(TAG, "No request for id " + id);
						return;
					}
					promise.resolve(request);
				} else {
					invokeMethod(request.getString("type"), request.getJSONArray("args"))
							.then(result -> {
								sendResponse(request, result);
							})
							.fail(e -> sendErrorResponse(request, e));
				}
			} catch (JSONException e) {
				Log.e("Native", "could not parse msg:" + msg, e);
			}
		}).start();
	}

	Promise<Object, Exception, ?> sendRequest(JsRequest type, Object[] args) {
		JSONObject request = new JSONObject();
		String requestId = createRequestId();
		try {
			JSONArray arguments = new JSONArray();
			for (Object arg : args) {
				arguments.put(arg);
			}
			request.put("id", requestId);
			request.put("type", type.toString());
			request.put("args", arguments);
			this.postMessage(request);
			DeferredObject<Object, Exception, Void> d = new DeferredObject<>();
			this.queue.put(requestId, d);
			return d.promise();
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
	}

	private static String createRequestId() {
		return "app" + requestId++;
	}

	private void sendResponse(JSONObject request, Object value) {
		JSONObject response = new JSONObject();
		try {
			response.put("id", request.getString("id"));
			response.put("type", "response");
			response.put("value", value);
			postMessage(response);
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
	}

	private void sendErrorResponse(JSONObject request, Exception ex) {
		JSONObject response = new JSONObject();
		try {
			response.put("id", request.getString("id"));
			response.put("type", "requestError");
			response.put("error", errorToObject(ex));
			postMessage(response);
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
	}

	private void postMessage(final JSONObject json) {
		evaluateJs("tutao.nativeApp.handleMessageFromNative('" + escape(json.toString()) + "')");
	}

	private void evaluateJs(final String js) {
		activity.getWebView().post(() -> {
			activity.getWebView().evaluateJavascript(js, value -> {
				// no response expected
			});
		});
	}

	private Promise<Object, Exception, Void> invokeMethod(String method, JSONArray args) {
		Deferred<Object, Exception, Void> promise = new DeferredObject<>();
		try {
			switch (method) {
				case "init":
					if (!webAppInitialized.isResolved()) {
						webAppInitialized.resolve(null);
					}
					promise.resolve("android");
					break;
				case "reload":
					webAppInitialized = new DeferredObject<>();
					activity.loadMainPage(args.getString(0));
					break;
				case "initPushNotifications":
					return initPushNotifications();
				case "generateRsaKey":
					promise.resolve(crypto.generateRsaKey(Utils.base64ToBytes(args.getString(0))));
					break;
				case "rsaEncrypt":
					promise.resolve(crypto.rsaEncrypt(args.getJSONObject(0), Utils.base64ToBytes(args.getString(1)), Utils.base64ToBytes(args.getString(2))));
					break;
				case "rsaDecrypt":
					promise.resolve(crypto.rsaDecrypt(args.getJSONObject(0), Utils.base64ToBytes(args.getString(1))));
					break;
				case "aesEncryptFile":
					Crypto.EncryptedFileInfo efi = crypto.aesEncryptFile(Utils.base64ToBytes(args.getString(0)), args.getString(1),
							Utils.base64ToBytes(args.getString(2)));
					promise.resolve(efi.toJSON());
					break;
				case "aesDecryptFile": {
					final byte[] key = Utils.base64ToBytes(args.getString(0));
					final String fileUrl = args.getString(1);

					promise.resolve(crypto.aesDecryptFile(key, fileUrl));
					break;
				}
				case "open":
					return files.openFile(args.getString(0), args.getString(1));
				case "openFileChooser":
					return files.openFileChooser();
				case "deleteFile":
					files.delete(args.getString(0));
					promise.resolve(null);
					break;
				case "getName":
					promise.resolve(files.getName(args.getString(0)));
					break;
				case "getMimeType":
					promise.resolve(files.getMimeType(Uri.parse(args.getString(0))));
					break;
				case "getSize":
					promise.resolve(files.getSize(args.getString(0)) + "");
					break;
				case "upload":
					promise.resolve(files.upload(args.getString(0), args.getString(1), args.getJSONObject(2)));
					break;
				case "download":
					promise.resolve(files.download(args.getString(0), args.getString(1), args.getJSONObject(2)));
					break;
				case "clearFileData":
					files.clearFileData();
					promise.resolve(null);
					break;
				case "findSuggestions":
					return contact.findSuggestions(args.getString(0));
				case "openLink":
					promise.resolve(openLink(args.getString(0)));
					break;
				case "shareText":
					promise.resolve(shareText(args.getString(0), args.getString(1)));
					break;
				case "getPushIdentifier":
					promise.resolve(sseStorage.getPushIdentifier());
					break;
				case "storePushIdentifierLocally":

					String deviceIdentififer = args.getString(0);
					String userId = args.getString(1);
					String sseOrigin = args.getString(2);
					Log.d(TAG, "storePushIdentifierLocally: " + deviceIdentififer + " " + userId + " " + sseOrigin);
					sseStorage.storePushIdentifier(deviceIdentififer, sseOrigin);

					String pushIdentifierId = args.getString(3);
					String pushIdentifierSessionKeyB64 = args.getString(4);
					sseStorage.storePushIdentifierSessionKey(userId, pushIdentifierId, pushIdentifierSessionKeyB64);
					promise.resolve(true);
					break;
				case "closePushNotifications":
					JSONArray addressesArray = args.getJSONArray(0);
					cancelNotifications(addressesArray);
					promise.resolve(true);
					break;
				case "readFile":
					promise.resolve(Utils.bytesToBase64(
							Utils.readFile(new File(activity.getFilesDir(), args.getString(0)))));
					break;
				case "writeFile": {
					final String filename = args.getString(0);
					final String contentInBase64 = args.getString(1);
					Utils.writeFile(new File(activity.getFilesDir(), filename),
							Utils.base64ToBytes(contentInBase64));
					promise.resolve(true);
					break;
				}
				case "changeTheme":
					activity.changeTheme(args.getString(0));
					break;
				case "saveBlob":
					return files.saveBlob(args.getString(0), args.getString(1));
				case "putFileIntoDownloads":
					final String path = args.getString(0);
					return files.putToDownloadFolder(path);
				case "getDeviceLog":
					return Utils.resolvedDeferred(LogReader.getLogFile(activity).toString());
//				case "unscheduleAlarms":
//					Log.d(TAG, "unschedule alarms");
				// TODO: sse alarm storage may not work because SharedPreferences are not synced between processes	
//					new AlarmNotificationsManager(new AndroidKeyStoreFacade(activity), sseStorage, new Crypto(activity), new SystemAlarmFacade(activity))
//							.unscheduleAlarms(args.getString(0));
//					return Utils.resolvedDeferred(null);
				case "changeLanguage":
					promise.resolve(null);
					break;
				default:
					throw new Exception("unsupported method: " + method);
			}
		} catch (Exception e) {
			Log.e(TAG, "failed invocation", e);
			promise.reject(e);
		}
		return promise.promise();
	}


	private void cancelNotifications(JSONArray addressesArray) throws JSONException {
		NotificationManager notificationManager =
				(NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
		Objects.requireNonNull(notificationManager);

		ArrayList<String> emailAddesses = new ArrayList<>(addressesArray.length());
		for (int i = 0; i < addressesArray.length(); i++) {
			notificationManager.cancel(Math.abs(addressesArray.getString(i).hashCode()));
			emailAddesses.add(addressesArray.getString(i));
		}
		activity.startService(LocalNotificationsFacade.notificationDismissedIntent(activity,
				emailAddesses, "Native", false));
	}

	private boolean openLink(@Nullable String uri) {
		Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
		PackageManager pm = activity.getPackageManager();
		boolean resolved = intent.resolveActivity(pm) != null;
		if (resolved) {
			activity.startActivity(intent);
		}
		return resolved;
	}

	private Uri getUriFromResource(int resourceId) {
		return new Uri.Builder()
				.scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
				.authority(activity.getResources().getResourcePackageName(resourceId))
				.appendPath(activity.getResources().getResourceTypeName(resourceId))
				.appendPath(activity.getResources().getResourceEntryName(resourceId))
				.build();
	}


	private boolean shareText(String string, @Nullable String title) {
		Intent sendIntent = new Intent(Intent.ACTION_SEND);
		sendIntent.setType("text/plain");
		sendIntent.putExtra(Intent.EXTRA_TEXT, string);

		// Shows a text title in the app chooser
		if (title != null) {
			sendIntent.putExtra(Intent.EXTRA_TITLE, title);
		}

		// In order to show a logo thumbnail with the app chooser we need to pass a URI of a file in the filesystem
		// we just save one of our resources to the temp directory and then pass that as ClipData
		// because you can't share non 'content' URIs with other apps
		Uri logoUri;
		try {
			InputStream logoInputStream = activity.getAssets().open("tutanota/images/logo-solo-red.png");
			File logoFile = this.files.writeFileToUnencryptedDir("logo-solo-red.png", logoInputStream);
			logoUri = FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, logoFile);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
		ClipData thumbnail = ClipData.newUri(
				activity.getContentResolver(),
				"tutanota_logo",
				logoUri
		);
		sendIntent.setClipData(thumbnail);
		sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

		Intent intent = Intent.createChooser(sendIntent, null);
		boolean resolved = intent.resolveActivity(activity.getPackageManager()) != null;
		if (resolved) {
			activity.startActivity(intent);
		}
		return resolved;
	}

	private Promise<Object, Exception, Void> initPushNotifications() {
		activity.runOnUiThread(() -> {
			activity.askBatteryOptinmizationsIfNeeded();
			activity.setupPushNotifications();
		});
		return Utils.resolvedDeferred(null);
	}

	private static JSONObject errorToObject(Exception e) throws JSONException {
		JSONObject error = new JSONObject();
		String errorType = e.getClass().getName();
		error.put("name", errorType);
		error.put("message", e.getMessage());
		error.put("stack", getStack(e));
		return error;
	}

	private static String getStack(Exception e) {
		StringWriter errors = new StringWriter();
		e.printStackTrace(new PrintWriter(errors));
		return errors.toString();
	}

	private static String escape(String s) {
		return Utils.bytesToBase64(s.getBytes());
	}

	DeferredObject<Void, Throwable, Void> getWebAppInitialized() {
		return webAppInitialized;
	}

}


