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

import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;

import java.io.FileNotFoundException;
import java.io.IOException;

/**
 * Plugins must extend this class and override one of the execute methods.
 */
public class CordovaPlugin {
    public CordovaWebView webView;
    public CordovaInterface cordova;
    protected CordovaPreferences preferences;
    private String serviceName;

    /**
     * Call this after constructing to initialize the plugin.
     * Final because we want to be able to change args without breaking plugins.
     */
    public final void privateInitialize(String serviceName, CordovaInterface cordova, CordovaWebView webView, CordovaPreferences preferences) {
        assert this.cordova == null;
        this.serviceName = serviceName;
        this.cordova = cordova;
        this.webView = webView;
        this.preferences = preferences;
        initialize(cordova, webView);
        pluginInitialize();
    }

    /**
     * Called after plugin construction and fields have been initialized.
     * Prefer to use pluginInitialize instead since there is no value in
     * having parameters on the initialize() function.
     */
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    }

    /**
     * Called after plugin construction and fields have been initialized.
     */
    protected void pluginInitialize() {
    }

    /**
     * Returns the plugin's service name (what you'd use when calling pluginManger.getPlugin())
     */
    public String getServiceName() {
        return serviceName;
    }
    
    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial amount of work, use:
     *     cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use:
     *     cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action          The action to execute.
     * @param rawArgs         The exec() arguments in JSON form.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return                Whether the action was valid.
     */
    public boolean execute(String action, String rawArgs, CallbackContext callbackContext) throws JSONException {
        JSONArray args = new JSONArray(rawArgs);
        return execute(action, args, callbackContext);
    }

    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial amount of work, use:
     *     cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use:
     *     cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action          The action to execute.
     * @param args            The exec() arguments.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return                Whether the action was valid.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        CordovaArgs cordovaArgs = new CordovaArgs(args);
        return execute(action, cordovaArgs, callbackContext);
    }

    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial amount of work, use:
     *     cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use:
     *     cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action          The action to execute.
     * @param args            The exec() arguments, wrapped with some Cordova helpers.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return                Whether the action was valid.
     */
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {
        return false;
    }

    /**
     * Called when the system is about to start resuming a previous activity.
     *
     * @param multitasking		Flag indicating if multitasking is turned on for app
     */
    public void onPause(boolean multitasking) {
    }

    /**
     * Called when the activity will start interacting with the user.
     *
     * @param multitasking		Flag indicating if multitasking is turned on for app
     */
    public void onResume(boolean multitasking) {
    }

    /**
     * Called when the activity is becoming visible to the user.
     */
    public void onStart() {
    }

    /**
     * Called when the activity is no longer visible to the user.
     */
    public void onStop() {
    }

    /**
     * Called when the activity receives a new intent.
     */
    public void onNewIntent(Intent intent) {
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
    }

    /**
     * Called when a message is sent to plugin.
     *
     * @param id            The message id
     * @param data          The message data
     * @return              Object to stop propagation or null
     */
    public Object onMessage(String id, Object data) {
        return null;
    }

    /**
     * Called when an activity you launched exits, giving you the requestCode you started it with,
     * the resultCode it returned, and any additional data from it.
     *
     * @param requestCode   The request code originally supplied to startActivityForResult(),
     *                      allowing you to identify who this result came from.
     * @param resultCode    The integer result code returned by the child activity through its setResult().
     * @param intent        An Intent, which can return result data to the caller (various data can be
     *                      attached to Intent "extras").
     */
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
    }

    /**
     * Hook for blocking the loading of external resources.
     *
     * This will be called when the WebView's shouldInterceptRequest wants to
     * know whether to open a connection to an external resource. Return false
     * to block the request: if any plugin returns false, Cordova will block
     * the request. If all plugins return null, the default policy will be
     * enforced. If at least one plugin returns true, and no plugins return
     * false, then the request will proceed.
     *
     * Note that this only affects resource requests which are routed through
     * WebViewClient.shouldInterceptRequest, such as XMLHttpRequest requests and
     * img tag loads. WebSockets and media requests (such as <video> and <audio>
     * tags) are not affected by this method. Use CSP headers to control access
     * to such resources.
     */
    public Boolean shouldAllowRequest(String url) {
        return null;
    }

    /**
     * Hook for blocking navigation by the Cordova WebView. This applies both to top-level and
     * iframe navigations.
     *
     * This will be called when the WebView's needs to know whether to navigate
     * to a new page. Return false to block the navigation: if any plugin
     * returns false, Cordova will block the navigation. If all plugins return
     * null, the default policy will be enforced. It at least one plugin returns
     * true, and no plugins return false, then the navigation will proceed.
     */
    public Boolean shouldAllowNavigation(String url) {
        return null;
    }

    /**
     * Hook for allowing page to call exec(). By default, this returns the result of
     * shouldAllowNavigation(). It's generally unsafe to allow untrusted content to be loaded
     * into a CordovaWebView, even within an iframe, so it's best not to touch this.
     */
    public Boolean shouldAllowBridgeAccess(String url) {
        return shouldAllowNavigation(url);
    }

    /**
     * Hook for blocking the launching of Intents by the Cordova application.
     *
     * This will be called when the WebView will not navigate to a page, but
     * could launch an intent to handle the URL. Return false to block this: if
     * any plugin returns false, Cordova will block the navigation. If all
     * plugins return null, the default policy will be enforced. If at least one
     * plugin returns true, and no plugins return false, then the URL will be
     * opened.
     */
    public Boolean shouldOpenExternalUrl(String url) {
        return null;
    }

    /**
     * Allows plugins to handle a link being clicked. Return true here to cancel the navigation.
     *
     * @param url           The URL that is trying to be loaded in the Cordova webview.
     * @return              Return true to prevent the URL from loading. Default is false.
     */
    public boolean onOverrideUrlLoading(String url) {
        return false;
    }

    /**
     * Hook for redirecting requests. Applies to WebView requests as well as requests made by plugins.
     * To handle the request directly, return a URI in the form:
     *
     *    cdvplugin://pluginId/...
     *
     * And implement handleOpenForRead().
     * To make this easier, use the toPluginUri() and fromPluginUri() helpers:
     *
     *     public Uri remapUri(Uri uri) { return toPluginUri(uri); }
     *
     *     public CordovaResourceApi.OpenForReadResult handleOpenForRead(Uri uri) throws IOException {
     *         Uri origUri = fromPluginUri(uri);
     *         ...
     *     }
     */
    public Uri remapUri(Uri uri) {
        return null;
    }

    /**
     * Called to handle CordovaResourceApi.openForRead() calls for a cdvplugin://pluginId/ URL.
     * Should never return null.
     * Added in cordova-android@4.0.0
     */
    public CordovaResourceApi.OpenForReadResult handleOpenForRead(Uri uri) throws IOException {
        throw new FileNotFoundException("Plugin can't handle uri: " + uri);
    }

    /**
     * Refer to remapUri()
     * Added in cordova-android@4.0.0
     */
    protected Uri toPluginUri(Uri origUri) {
        return new Uri.Builder()
            .scheme(CordovaResourceApi.PLUGIN_URI_SCHEME)
            .authority(serviceName)
            .appendQueryParameter("origUri", origUri.toString())
            .build();
    }

    /**
     * Refer to remapUri()
     * Added in cordova-android@4.0.0
     */
    protected Uri fromPluginUri(Uri pluginUri) {
        return Uri.parse(pluginUri.getQueryParameter("origUri"));
    }

    /**
     * Called when the WebView does a top-level navigation or refreshes.
     *
     * Plugins should stop any long-running processes and clean up internal state.
     *
     * Does nothing by default.
     */
    public void onReset() {
    }
    
    /**
     * Called when the system received an HTTP authentication request. Plugin can use
     * the supplied HttpAuthHandler to process this auth challenge.
     *
     * @param view              The WebView that is initiating the callback
     * @param handler           The HttpAuthHandler used to set the WebView's response
     * @param host              The host requiring authentication
     * @param realm             The realm for which authentication is required
     * 
     * @return                  Returns True if plugin will resolve this auth challenge, otherwise False
     * 
     */
    public boolean onReceivedHttpAuthRequest(CordovaWebView view, ICordovaHttpAuthHandler handler, String host, String realm) {
        return false;
    }
    
    /**
     * Called when he system received an SSL client certificate request.  Plugin can use
     * the supplied ClientCertRequest to process this certificate challenge.
     *
     * @param view              The WebView that is initiating the callback
     * @param request           The client certificate request
     *
     * @return                  Returns True if plugin will resolve this auth challenge, otherwise False
     *
     */
    public boolean onReceivedClientCertRequest(CordovaWebView view, ICordovaClientCertRequest request) {
        return false;
    }

    /**
     * Called by the system when the device configuration changes while your activity is running.
     *
     * @param newConfig		The new device configuration
     */
    public void onConfigurationChanged(Configuration newConfig) {
    }

    /**
     * Called by the Plugin Manager when we need to actually request permissions
     *
     * @param requestCode   Passed to the activity to track the request
     *
     * @return              Returns the permission that was stored in the plugin
     */

    public void requestPermissions(int requestCode) {
    }

    /*
     * Called by the WebView implementation to check for geolocation permissions, can be used
     * by other Java methods in the event that a plugin is using this as a dependency.
     *
     * @return          Returns true if the plugin has all the permissions it needs to operate.
     */

    public boolean hasPermisssion() {
        return true;
    }

    /**
     * Called by the system when the user grants permissions
     *
     * @param requestCode
     * @param permissions
     * @param grantResults
     */
    public void onRequestPermissionResult(int requestCode, String[] permissions,
                                          int[] grantResults) throws JSONException {

    }
}
