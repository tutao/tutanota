package de.tutao.file;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.Iterator;

import org.apache.commons.io.IOUtils;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterfaceImpl;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PermissionHelper;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.webkit.MimeTypeMap;

import com.ipaulpro.afilechooser.utils.FileUtils;

import de.tutao.plugin.Crypto;
import de.tutao.plugin.Utils;
 
public class FileUtil extends CordovaPlugin {
	private final static String TAG = "tutao.FileUtil";
	static final int SHOW_FILE_REQUEST = 24325;
	static final int PICK_FILE_REQUEST = SHOW_FILE_REQUEST + 1;
	private static final int HTTP_TIMEOUT = 15 * 1000;
	private CallbackContext callbackContext;

	private JSONArray args;
	private String action;

	private static final String READ_EXTERNAL_STORAGE_PERMISSION = Manifest.permission.READ_EXTERNAL_STORAGE;
	private static final Integer READ_EXTERNAL_STORAGE_REQUEST_CODE = 0;

	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		this.action = action;
		this.args = args;
		this.callbackContext = callbackContext;


		// Requesting android runtime permissions. (Android 5+)
		// We only need to request the read permission even if we want to get write access. There is only one permission of a permission group necessary to get
		// access to all permission of that permission group. We still have to declare write access in the manifest.
		// https://developer.android.com/guide/topics/security/permissions.html#perm-groups

		// requesting runtime permissions following the cordova plugin development guidelines.
		// https://cordova.apache.org/docs/en/latest/guide/platforms/android/plugin.html#android-permissions

		// We use the PermissionHelper from https://github.com/apache/cordova-plugin-compat which provides backward compatibility for older android versions.
		// The PermissionHelper is also used by the contact plugin.
		if (this.isPermissionNeeded(action, args) && !PermissionHelper.hasPermission(this, READ_EXTERNAL_STORAGE_PERMISSION)) {
			PermissionHelper.requestPermission(this, READ_EXTERNAL_STORAGE_REQUEST_CODE, READ_EXTERNAL_STORAGE_PERMISSION);
			return true;
		} else {
			return this.internalExecute(action, args, callbackContext);
		}
	}

	private boolean isPermissionNeeded(String action, JSONArray args) throws JSONException {
		if (action.equals("openFileChooser" )) {
			return true;
		} else if (action.equals("write" ) || action.equals("read" ) || action.equals("delete" ) || action.equals("open" )) {
			String appDir = "file://" + Utils.getDir(webView.getContext()).getAbsolutePath();
			String requestedFileName = args.getString(0);
			// no permission is needed if the file is stored in the app dir.
			return !requestedFileName.startsWith(appDir);
		} else {
			return false;
		}
	}

	private boolean internalExecute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		try {
			if (action.equals("open")) {
				this.openFile(args.getString(0), args.getString(1), callbackContext);
			} else if (action.equals("openFileChooser")) {
				this.openFileChooser(callbackContext);
			} else if (action.equals("write")) {
				this.writeFile(callbackContext, args.getString(0), args.getString(1));
			} else if (action.equals("read")) {
				this.readFile(callbackContext, args.getString(0));
			} else if (action.equals("delete")) {
				this.delete(callbackContext, args.getString(0));
			} else if (action.equals("getName")) {
				this.getName(callbackContext, args.getString(0));
			} else if (action.equals("getMimeType")) {
				this.getMimeType(callbackContext, args.getString(0));
			} else if (action.equals("getSize")) {
				this.getSize(callbackContext, args.getString(0));
			} else if (action.equals("upload")) {
				this.upload(callbackContext, args.getString(0), args.getString(1), args.getJSONObject(2));
			} else if (action.equals("download")) {
				this.download(callbackContext, args.getString(0), args.getString(1), args.getJSONObject(2));
			} else {
				callbackContext.sendPluginResult(new PluginResult(
						PluginResult.Status.ERROR, "unsupported method"));
				return false;
			}
			return true;
		} catch (Exception e) {
			Log.e(TAG, "error during " + action, e);
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
			return false;
		}
	}

	private void writeFile(CallbackContext callbackContext, String absolutePath, String base64) throws FileNotFoundException, IOException {
		Utils.writeFile(Utils.uriToFile(webView.getContext(), absolutePath), Utils.base64ToBytes(base64));
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
	}

	private void readFile(CallbackContext callbackContext, String absolutePath) throws IOException {
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.bytesToBase64(Utils.readFile(Utils.uriToFile(webView.getContext(),
					absolutePath)))));
	}

	private void delete(final CallbackContext callbackContext, final String absolutePath) {
		Utils.run(cordova, new Runnable() {
			@Override
			public void run() {
				try {
					Context context = webView.getContext();
					File file = Utils.uriToFile(context, absolutePath);
					if (!absolutePath.startsWith(Uri.fromFile(Utils.getDir(context)).toString())) {
						// we do not delete files that are not stored in our cache dir
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
					} else {
						if (file.delete()) {
							callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
						} else {
							callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR));
						}
					}
				} catch (Exception e) {
					Log.e(TAG, "error during delete of " + absolutePath, e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}

	private void openFileChooser(CallbackContext callbackContext) {
		Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
		intent.setType("*/*");
		intent.addCategory(Intent.CATEGORY_OPENABLE);
		intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);

		Intent chooser = Intent.createChooser(intent, "Select File");
		this.callbackContext = callbackContext;
		cordova.startActivityForResult(this, chooser, PICK_FILE_REQUEST);
	}

	// @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
	private void openFile(String fileName, String mimeType, CallbackContext callbackContext) {
		java.io.File file = Utils.uriToFile(webView.getContext(), fileName);

		if (file.exists()) {
			Uri path = Uri.parse(fileName);
			if (path.getAuthority().equals("")) {
				path = FileProvider.getUriForFile(this.cordova.getActivity().getApplicationContext(), "de.tutao.fileprovider", file);
			}
			Intent intent = new Intent(Intent.ACTION_VIEW);
			intent.setDataAndType(path, getCorrectedMimeType(fileName, mimeType));
			intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
			// @see http://stackoverflow.com/questions/14321376/open-an-activity-from-a-cordovaplugin
			this.callbackContext = callbackContext;
			cordova.startActivityForResult(this, intent, SHOW_FILE_REQUEST);
		} else {
			callbackContext.sendPluginResult(new PluginResult(
					PluginResult.Status.ERROR, "file does not exist"));
		}
	}

	private String getCorrectedMimeType(String fileName, String storedMimeType) {
		if (storedMimeType == null || storedMimeType.isEmpty() || storedMimeType.equals("application/octet-stream")) {
			String extension = FileUtils.getExtension(fileName);
			if (extension.length() > 0) {
				String newMimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.substring(1));
				if (newMimeType != null && !newMimeType.isEmpty()) {
					return newMimeType;
				} else {
					return "application/octet-stream";
				}
			} else {
				return "application/octet-stream";
			}
		} else {
			return storedMimeType;
		}
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		if (requestCode == SHOW_FILE_REQUEST) {
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
		} else if (requestCode == PICK_FILE_REQUEST) {
			if (resultCode == Activity.RESULT_CANCELED || intent.getData() == null) { // both may happen if no file is selected
				callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.NO_RESULT));
			} else {
				Uri uri = intent.getData();
				try {
					String contentPath = uri.toString(); // uri that starts with content:/ and is not directly accessible as a file
					Log.v(TAG, "uri of selected file: " + contentPath);
					File file = Utils.uriToFile(webView.getContext(), uri.toString());
					if (!file.exists()) {
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "File does not exist!"));
					} else {
						String fileUri = file.toURI().toString();
						Log.i(TAG, "selected file: " + fileUri);
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, contentPath));
					}
				} catch (Exception e) {
					Log.e(TAG, "error during file selection of " + uri, e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		} else {
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "illegal requestCode: " + requestCode));
		}
	}

	private void getSize(CallbackContext callbackContext, String absolutePath) {
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.uriToFile(webView.getContext(), absolutePath).length() + ""));
	}

	private void getMimeType(CallbackContext callbackContext, String absolutePath) {
		String mimeType = FileUtils.getMimeType(Utils.uriToFile(webView.getContext(), absolutePath));
		if (mimeType == null) {
			mimeType = "application/octet-stream";
		}
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, mimeType));
	}

	private void getName(CallbackContext callbackContext, String absolutePath) {
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.uriToFile(webView.getContext(), absolutePath).getName()));
	}

	private void upload(final CallbackContext callbackContext, final String absolutePath, final String targetUrl, final JSONObject headers) {
		Utils.run(cordova, new Runnable() {

			@Override
			public void run() {
				try {
					File file = Utils.uriToFile(webView.getContext(), absolutePath);
					HttpURLConnection con = (HttpURLConnection) (new URL(targetUrl)).openConnection();
					try {
						con.setConnectTimeout(HTTP_TIMEOUT);
						con.setReadTimeout(HTTP_TIMEOUT);
						con.setRequestMethod("PUT");
						con.setDoInput(true);
						con.setUseCaches(false);
						con.setRequestProperty("Content-Type", "application/octet-stream");
						con.setChunkedStreamingMode(4096); // mitigates OOM for large files (start uploading before the complete file is buffered)
						addHeadersToRequest(con, headers);
						con.connect();

						IOUtils.copy(new FileInputStream(file), con.getOutputStream());

						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, con.getResponseCode() + ""));
					} finally {
						con.disconnect();
					}
				} catch (Exception e) {
					Log.e(TAG, "error during upload to " + targetUrl, e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}

	private void download(final CallbackContext callbackContext, final String sourceUrl, final String filename, final JSONObject headers) {
		Utils.run(cordova, new Runnable() {

			@Override
			public void run() {
				try {
					HttpURLConnection con = (HttpURLConnection) (new URL(sourceUrl)).openConnection();
					try {
						con.setConnectTimeout(HTTP_TIMEOUT);
						con.setReadTimeout(HTTP_TIMEOUT);
						con.setRequestMethod("GET");
						con.setDoInput(true);
						con.setUseCaches(false);
						addHeadersToRequest(con, headers);
						con.connect();

						Context context = webView.getContext();
						File encryptedDir = new File(Utils.getDir(context), Crypto.TEMP_DIR_ENCRYPTED);
						encryptedDir.mkdirs();
						File encryptedFile = new File(encryptedDir, filename);

						IOUtils.copy(con.getInputStream(), new FileOutputStream(encryptedFile));

						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.fileToUri(encryptedFile)));
					} finally {
						con.disconnect();
					}
				} catch (Exception e) {
					Log.e(TAG, "error during download from " + sourceUrl, e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}

	private static void addHeadersToRequest(URLConnection connection, JSONObject headers) throws JSONException {
		for (Iterator<?> iter = headers.keys(); iter.hasNext();) {
			String headerKey = iter.next().toString();
			JSONArray headerValues = headers.optJSONArray(headerKey);
			if (headerValues == null) {
				headerValues = new JSONArray();
				headerValues.put(headers.getString(headerKey));
			}
			connection.setRequestProperty(headerKey, headerValues.getString(0));
			for (int i = 1; i < headerValues.length(); ++i) {
				connection.addRequestProperty(headerKey, headerValues.getString(i));
			}
		}
	}


	public void onRequestPermissionResult(int requestCode, String[] permissions,  int[] grantResults) throws JSONException {
		for(int r:grantResults) {
			if(r == PackageManager.PERMISSION_DENIED) {
				this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "permission_denied"));
				return;
			}
		}
		if(requestCode == READ_EXTERNAL_STORAGE_REQUEST_CODE) {
			this.internalExecute(this.action, this.args, this.callbackContext);;
		} else {
			this.callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "invalid_permission_request"));
		}
	}

}
