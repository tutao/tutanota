package de.tutao.plugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.util.Log;

public class Util extends CordovaPlugin {
	private final static String TAG = "tutao.Crypto";
	
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		try {
			if (action.equals("switchToHomescreen")) {
				this.switchToHomeScreen(callbackContext);
			} else {
				callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR));
				return false;
			}
			return true;
		} catch (Exception e) {
			Log.e(TAG, "error during " + action, e);
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
			return false;
		}
	}

	private void switchToHomeScreen(CallbackContext callbackContext) {
        Intent i = new Intent(Intent.ACTION_MAIN);
        i.addCategory(Intent.CATEGORY_HOME);
        this.cordova.getActivity().startActivity(i);	
        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
	}
}
