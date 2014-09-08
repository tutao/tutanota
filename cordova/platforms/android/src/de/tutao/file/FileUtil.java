package de.tutao.file;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.v4.content.FileProvider;
import android.webkit.JavascriptInterface;

public class FileUtil extends CordovaPlugin {
	static final int SHOW_FILE_REQUEST = 24325;
	private CallbackContext callbackContext;

	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		if (action.equals("open")) {
			this.openFile(args.getString(0), callbackContext);
			return true;
		}
		callbackContext.sendPluginResult(new PluginResult(
				PluginResult.Status.ERROR, "unsupported method"));
		return false;
	}
	
	@JavascriptInterface
	public void test(byte[] bytes) {
		
	}

	// @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
	private void openFile(String fileName, CallbackContext callbackContext) {
		try {
	        if (fileName.startsWith("file://")) {
	        	fileName = fileName.substring(7);
	        }

			java.io.File file = new java.io.File(fileName);
			
			if (file.exists()) {
				Uri path = FileProvider.getUriForFile(this.cordova.getActivity().getApplicationContext(), "de.tutao.fileprovider", file);
				Intent intent = new Intent(Intent.ACTION_VIEW);
				intent.setData(path);
				intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                // @see http://stackoverflow.com/questions/14321376/open-an-activity-from-a-cordovaplugin
				cordova.startActivityForResult(this, intent, SHOW_FILE_REQUEST);
				this.callbackContext = callbackContext;
			} else {
				callbackContext.sendPluginResult(new PluginResult(
						PluginResult.Status.ERROR, "file does not exist"));
			}
		} catch (Exception e) {
			e.printStackTrace();
			callbackContext.sendPluginResult(new PluginResult(
					PluginResult.Status.ERROR, e.getMessage()));
		}
	}
	
	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		if (requestCode != SHOW_FILE_REQUEST) {
			throw new RuntimeException("wrong requestCode, only SHOW_FILE_REQUEST allowed!");
		}
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
	}

}
