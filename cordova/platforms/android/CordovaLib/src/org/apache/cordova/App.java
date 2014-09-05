/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

package org.apache.cordova;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.telephony.TelephonyManager;

import java.util.HashMap;

/**
 * This class exposes methods in Cordova that can be called from JavaScript.
 */
public class App extends CordovaPlugin {

    protected static final String TAG = "CordovaApp";
    private BroadcastReceiver telephonyReceiver;

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The CordovaWebView Cordova is running in.
     */
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.initTelephonyReceiver();
    }


    /**
     * Executes the request and returns PluginResult.
     *
     * @param action            The action to execute.
     * @param args              JSONArry of arguments for the plugin.
     * @param callbackContext   The callback context from which we were invoked.
     * @return                  A PluginResult object with a status and message.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        PluginResult.Status status = PluginResult.Status.OK;
        String result = "";

        try {
            if (action.equals("clearCache")) {
                this.clearCache();
            }
            else if (action.equals("show")) {
                // This gets called from JavaScript onCordovaReady to show the webview.
                // I recommend we change the name of the Message as spinner/stop is not
                // indicative of what this actually does (shows the webview).
                cordova.getActivity().runOnUiThread(new Runnable() {
                    public void run() {
                        webView.postMessage("spinner", "stop");
                    }
                });
            }
            else if (action.equals("loadUrl")) {
                this.loadUrl(args.getString(0), args.optJSONObject(1));
            }
            else if (action.equals("cancelLoadUrl")) {
                //this.cancelLoadUrl();
            }
            else if (action.equals("clearHistory")) {
                this.clearHistory();
            }
            else if (action.equals("backHistory")) {
                this.backHistory();
            }
            else if (action.equals("overrideButton")) {
                this.overrideButton(args.getString(0), args.getBoolean(1));
            }
            else if (action.equals("overrideBackbutton")) {
                this.overrideBackbutton(args.getBoolean(0));
            }
            else if (action.equals("exitApp")) {
                this.exitApp();
            }
            callbackContext.sendPluginResult(new PluginResult(status, result));
            return true;
        } catch (JSONException e) {
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
            return false;
        }
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------

    /**
     * Clear the resource cache.
     */
    public void clearCache() {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                webView.clearCache(true);
            }
        });
    }

    /**
     * Load the url into the webview.
     *
     * @param url
     * @param props			Properties that can be passed in to the Cordova activity (i.e. loadingDialog, wait, ...)
     * @throws JSONException
     */
    public void loadUrl(String url, JSONObject props) throws JSONException {
        LOG.d("App", "App.loadUrl("+url+","+props+")");
        int wait = 0;
        boolean openExternal = false;
        boolean clearHistory = false;

        // If there are properties, then set them on the Activity
        HashMap<String, Object> params = new HashMap<String, Object>();
        if (props != null) {
            JSONArray keys = props.names();
            for (int i = 0; i < keys.length(); i++) {
                String key = keys.getString(i);
                if (key.equals("wait")) {
                    wait = props.getInt(key);
                }
                else if (key.equalsIgnoreCase("openexternal")) {
                    openExternal = props.getBoolean(key);
                }
                else if (key.equalsIgnoreCase("clearhistory")) {
                    clearHistory = props.getBoolean(key);
                }
                else {
                    Object value = props.get(key);
                    if (value == null) {

                    }
                    else if (value.getClass().equals(String.class)) {
                        params.put(key, (String)value);
                    }
                    else if (value.getClass().equals(Boolean.class)) {
                        params.put(key, (Boolean)value);
                    }
                    else if (value.getClass().equals(Integer.class)) {
                        params.put(key, (Integer)value);
                    }
                }
            }
        }

        // If wait property, then delay loading

        if (wait > 0) {
            try {
                synchronized(this) {
                    this.wait(wait);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        this.webView.showWebPage(url, openExternal, clearHistory, params);
    }

    /**
     * Clear page history for the app.
     */
    public void clearHistory() {
        this.webView.clearHistory();
    }

    /**
     * Go to previous page displayed.
     * This is the same as pressing the backbutton on Android device.
     */
    public void backHistory() {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                webView.backHistory();
            }
        });
    }

    /**
     * Override the default behavior of the Android back button.
     * If overridden, when the back button is pressed, the "backKeyDown" JavaScript event will be fired.
     *
     * @param override		T=override, F=cancel override
     */
    public void overrideBackbutton(boolean override) {
        LOG.i("App", "WARNING: Back Button Default Behavior will be overridden.  The backbutton event will be fired!");
        webView.bindButton(override);
    }

    /**
     * Override the default behavior of the Android volume buttons.
     * If overridden, when the volume button is pressed, the "volume[up|down]button" JavaScript event will be fired.
     *
     * @param button        volumeup, volumedown
     * @param override      T=override, F=cancel override
     */
    public void overrideButton(String button, boolean override) {
        LOG.i("App", "WARNING: Volume Button Default Behavior will be overridden.  The volume event will be fired!");
        webView.bindButton(button, override);
    }

    /**
     * Return whether the Android back button is overridden by the user.
     *
     * @return boolean
     */
    public boolean isBackbuttonOverridden() {
        return webView.isBackButtonBound();
    }

    /**
     * Exit the Android application.
     */
    public void exitApp() {
        this.webView.postMessage("exit", null);
    }
    

    /**
     * Listen for telephony events: RINGING, OFFHOOK and IDLE
     * Send these events to all plugins using
     *      CordovaActivity.onMessage("telephone", "ringing" | "offhook" | "idle")
     */
    private void initTelephonyReceiver() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
        //final CordovaInterface mycordova = this.cordova;
        this.telephonyReceiver = new BroadcastReceiver() {

            @Override
            public void onReceive(Context context, Intent intent) {

                // If state has changed
                if ((intent != null) && intent.getAction().equals(TelephonyManager.ACTION_PHONE_STATE_CHANGED)) {
                    if (intent.hasExtra(TelephonyManager.EXTRA_STATE)) {
                        String extraData = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                        if (extraData.equals(TelephonyManager.EXTRA_STATE_RINGING)) {
                            LOG.i(TAG, "Telephone RINGING");
                            webView.postMessage("telephone", "ringing");
                        }
                        else if (extraData.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)) {
                            LOG.i(TAG, "Telephone OFFHOOK");
                            webView.postMessage("telephone", "offhook");
                        }
                        else if (extraData.equals(TelephonyManager.EXTRA_STATE_IDLE)) {
                            LOG.i(TAG, "Telephone IDLE");
                            webView.postMessage("telephone", "idle");
                        }
                    }
                }
            }
        };

        // Register the receiver
        this.cordova.getActivity().registerReceiver(this.telephonyReceiver, intentFilter);
    }

    /*
     * Unregister the receiver
     *
     */
    public void onDestroy()
    {
        this.cordova.getActivity().unregisterReceiver(this.telephonyReceiver);
    }
}
