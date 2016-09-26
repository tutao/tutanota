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

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;

import org.apache.cordova.engine.SystemWebViewEngine;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Main class for interacting with a Cordova webview. Manages plugins, events, and a CordovaWebViewEngine.
 * Class uses two-phase initialization. You must call init() before calling any other methods.
 */
public class CordovaWebViewImpl implements CordovaWebView {

    public static final String TAG = "CordovaWebViewImpl";

    private PluginManager pluginManager;

    protected final CordovaWebViewEngine engine;
    private CordovaInterface cordova;

    // Flag to track that a loadUrl timeout occurred
    private int loadUrlTimeout = 0;

    private CordovaResourceApi resourceApi;
    private CordovaPreferences preferences;
    private CoreAndroid appPlugin;
    private NativeToJsMessageQueue nativeToJsMessageQueue;
    private EngineClient engineClient = new EngineClient();
    private boolean hasPausedEver;

    // The URL passed to loadUrl(), not necessarily the URL of the current page.
    String loadedUrl;

    /** custom view created by the browser (a video player for example) */
    private View mCustomView;
    private WebChromeClient.CustomViewCallback mCustomViewCallback;

    private Set<Integer> boundKeyCodes = new HashSet<Integer>();

    public static CordovaWebViewEngine createEngine(Context context, CordovaPreferences preferences) {
        String className = preferences.getString("webview", SystemWebViewEngine.class.getCanonicalName());
        try {
            Class<?> webViewClass = Class.forName(className);
            Constructor<?> constructor = webViewClass.getConstructor(Context.class, CordovaPreferences.class);
            return (CordovaWebViewEngine) constructor.newInstance(context, preferences);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create webview. ", e);
        }
    }

    public CordovaWebViewImpl(CordovaWebViewEngine cordovaWebViewEngine) {
        this.engine = cordovaWebViewEngine;
    }

    // Convenience method for when creating programmatically (not from Config.xml).
    public void init(CordovaInterface cordova) {
        init(cordova, new ArrayList<PluginEntry>(), new CordovaPreferences());
    }

    @Override
    public void init(CordovaInterface cordova, List<PluginEntry> pluginEntries, CordovaPreferences preferences) {
        if (this.cordova != null) {
            throw new IllegalStateException();
        }
        this.cordova = cordova;
        this.preferences = preferences;
        pluginManager = new PluginManager(this, this.cordova, pluginEntries);
        resourceApi = new CordovaResourceApi(engine.getView().getContext(), pluginManager);
        nativeToJsMessageQueue = new NativeToJsMessageQueue();
        nativeToJsMessageQueue.addBridgeMode(new NativeToJsMessageQueue.NoOpBridgeMode());
        nativeToJsMessageQueue.addBridgeMode(new NativeToJsMessageQueue.LoadUrlBridgeMode(engine, cordova));

        if (preferences.getBoolean("DisallowOverscroll", false)) {
            engine.getView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
        engine.init(this, cordova, engineClient, resourceApi, pluginManager, nativeToJsMessageQueue);
        // This isn't enforced by the compiler, so assert here.
        assert engine.getView() instanceof CordovaWebViewEngine.EngineView;

        pluginManager.addService(CoreAndroid.PLUGIN_NAME, "org.apache.cordova.CoreAndroid");
        pluginManager.init();

    }

    @Override
    public boolean isInitialized() {
        return cordova != null;
    }

    @Override
    public void loadUrlIntoView(final String url, boolean recreatePlugins) {
        LOG.d(TAG, ">>> loadUrl(" + url + ")");
        if (url.equals("about:blank") || url.startsWith("javascript:")) {
            engine.loadUrl(url, false);
            return;
        }

        recreatePlugins = recreatePlugins || (loadedUrl == null);

        if (recreatePlugins) {
            // Don't re-initialize on first load.
            if (loadedUrl != null) {
                pluginManager.init();
            }
            loadedUrl = url;
        }

        // Create a timeout timer for loadUrl
        final int currentLoadUrlTimeout = loadUrlTimeout;
        final int loadUrlTimeoutValue = preferences.getInteger("LoadUrlTimeoutValue", 20000);

        // Timeout error method
        final Runnable loadError = new Runnable() {
            public void run() {
                stopLoading();
                LOG.e(TAG, "CordovaWebView: TIMEOUT ERROR!");

                // Handle other errors by passing them to the webview in JS
                JSONObject data = new JSONObject();
                try {
                    data.put("errorCode", -6);
                    data.put("description", "The connection to the server was unsuccessful.");
                    data.put("url", url);
                } catch (JSONException e) {
                    // Will never happen.
                }
                pluginManager.postMessage("onReceivedError", data);
            }
        };

        // Timeout timer method
        final Runnable timeoutCheck = new Runnable() {
            public void run() {
                try {
                    synchronized (this) {
                        wait(loadUrlTimeoutValue);
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                // If timeout, then stop loading and handle error
                if (loadUrlTimeout == currentLoadUrlTimeout) {
                    cordova.getActivity().runOnUiThread(loadError);
                }
            }
        };

        final boolean _recreatePlugins = recreatePlugins;
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                if (loadUrlTimeoutValue > 0) {
                    cordova.getThreadPool().execute(timeoutCheck);
                }
                engine.loadUrl(url, _recreatePlugins);
            }
        });
    }


    @Override
    public void loadUrl(String url) {
        loadUrlIntoView(url, true);
    }

    @Override
    public void showWebPage(String url, boolean openExternal, boolean clearHistory, Map<String, Object> params) {
        LOG.d(TAG, "showWebPage(%s, %b, %b, HashMap)", url, openExternal, clearHistory);

        // If clearing history
        if (clearHistory) {
            engine.clearHistory();
        }

        // If loading into our webview
        if (!openExternal) {
            // Make sure url is in whitelist
            if (pluginManager.shouldAllowNavigation(url)) {
                // TODO: What about params?
                // Load new URL
                loadUrlIntoView(url, true);
            } else {
                LOG.w(TAG, "showWebPage: Refusing to load URL into webview since it is not in the <allow-navigation> whitelist. URL=" + url);
            }
        }
        if (!pluginManager.shouldOpenExternalUrl(url)) {
            LOG.w(TAG, "showWebPage: Refusing to send intent for URL since it is not in the <allow-intent> whitelist. URL=" + url);
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            // To send an intent without CATEGORY_BROWSER, a custom plugin should be used.
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            Uri uri = Uri.parse(url);
            // Omitting the MIME type for file: URLs causes "No Activity found to handle Intent".
            // Adding the MIME type to http: URLs causes them to not be handled by the downloader.
            if ("file".equals(uri.getScheme())) {
                intent.setDataAndType(uri, resourceApi.getMimeType(uri));
            } else {
                intent.setData(uri);
            }
            cordova.getActivity().startActivity(intent);
        } catch (android.content.ActivityNotFoundException e) {
            LOG.e(TAG, "Error loading url " + url, e);
        }
    }

    @Override
    @Deprecated
    public void showCustomView(View view, WebChromeClient.CustomViewCallback callback) {
        // This code is adapted from the original Android Browser code, licensed under the Apache License, Version 2.0
        Log.d(TAG, "showing Custom View");
        // if a view already exists then immediately terminate the new one
        if (mCustomView != null) {
            callback.onCustomViewHidden();
            return;
        }

        // Store the view and its callback for later (to kill it properly)
        mCustomView = view;
        mCustomViewCallback = callback;

        // Add the custom view to its container.
        ViewGroup parent = (ViewGroup) engine.getView().getParent();
        parent.addView(view, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
                Gravity.CENTER));

        // Hide the content view.
        engine.getView().setVisibility(View.GONE);

        // Finally show the custom view container.
        parent.setVisibility(View.VISIBLE);
        parent.bringToFront();
    }

    @Override
    @Deprecated
    public void hideCustomView() {
        // This code is adapted from the original Android Browser code, licensed under the Apache License, Version 2.0
        if (mCustomView == null) return;
        Log.d(TAG, "Hiding Custom View");

        // Hide the custom view.
        mCustomView.setVisibility(View.GONE);

        // Remove the custom view from its container.
        ViewGroup parent = (ViewGroup) engine.getView().getParent();
        parent.removeView(mCustomView);
        mCustomView = null;
        mCustomViewCallback.onCustomViewHidden();

        // Show the content view.
        engine.getView().setVisibility(View.VISIBLE);
    }

    @Override
    @Deprecated
    public boolean isCustomViewShowing() {
        return mCustomView != null;
    }

    @Override
    @Deprecated
    public void sendJavascript(String statement) {
        nativeToJsMessageQueue.addJavaScript(statement);
    }

    @Override
    public void sendPluginResult(PluginResult cr, String callbackId) {
        nativeToJsMessageQueue.addPluginResult(cr, callbackId);
    }

    @Override
    public PluginManager getPluginManager() {
        return pluginManager;
    }
    @Override
    public CordovaPreferences getPreferences() {
        return preferences;
    }
    @Override
    public ICordovaCookieManager getCookieManager() {
        return engine.getCookieManager();
    }
    @Override
    public CordovaResourceApi getResourceApi() {
        return resourceApi;
    }
    @Override
    public CordovaWebViewEngine getEngine() {
        return engine;
    }
    @Override
    public View getView() {
        return engine.getView();
    }
    @Override
    public Context getContext() {
        return engine.getView().getContext();
    }

    private void sendJavascriptEvent(String event) {
        if (appPlugin == null) {
            appPlugin = (CoreAndroid)pluginManager.getPlugin(CoreAndroid.PLUGIN_NAME);
        }

        if (appPlugin == null) {
            LOG.w(TAG, "Unable to fire event without existing plugin");
            return;
        }
        appPlugin.fireJavascriptEvent(event);
    }

    @Override
    public void setButtonPlumbedToJs(int keyCode, boolean override) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_VOLUME_DOWN:
            case KeyEvent.KEYCODE_VOLUME_UP:
            case KeyEvent.KEYCODE_BACK:
                // TODO: Why are search and menu buttons handled separately?
                if (override) {
                    boundKeyCodes.add(keyCode);
                } else {
                    boundKeyCodes.remove(keyCode);
                }
                return;
            default:
                throw new IllegalArgumentException("Unsupported keycode: " + keyCode);
        }
    }

    @Override
    public boolean isButtonPlumbedToJs(int keyCode) {
        return boundKeyCodes.contains(keyCode);
    }

    @Override
    public Object postMessage(String id, Object data) {
        return pluginManager.postMessage(id, data);
    }

    // Engine method proxies:
    @Override
    public String getUrl() {
        return engine.getUrl();
    }

    @Override
    public void stopLoading() {
        // Clear timeout flag
        loadUrlTimeout++;
    }

    @Override
    public boolean canGoBack() {
        return engine.canGoBack();
    }

    @Override
    public void clearCache() {
        engine.clearCache();
    }

    @Override
    @Deprecated
    public void clearCache(boolean b) {
        engine.clearCache();
    }

    @Override
    public void clearHistory() {
        engine.clearHistory();
    }

    @Override
    public boolean backHistory() {
        return engine.goBack();
    }

    /////// LifeCycle methods ///////
    @Override
    public void onNewIntent(Intent intent) {
        if (this.pluginManager != null) {
            this.pluginManager.onNewIntent(intent);
        }
    }
    @Override
    public void handlePause(boolean keepRunning) {
        if (!isInitialized()) {
            return;
        }
        hasPausedEver = true;
        pluginManager.onPause(keepRunning);
        sendJavascriptEvent("pause");

        // If app doesn't want to run in background
        if (!keepRunning) {
            // Pause JavaScript timers. This affects all webviews within the app!
            engine.setPaused(true);
        }
    }
    @Override
    public void handleResume(boolean keepRunning) {
        if (!isInitialized()) {
            return;
        }

        // Resume JavaScript timers. This affects all webviews within the app!
        engine.setPaused(false);
        this.pluginManager.onResume(keepRunning);
        // To be the same as other platforms, fire this event only when resumed after a "pause".
        if (hasPausedEver) {
            sendJavascriptEvent("resume");
        }
    }
    @Override
    public void handleStart() {
        if (!isInitialized()) {
            return;
        }
        pluginManager.onStart();
    }
    @Override
    public void handleStop() {
        if (!isInitialized()) {
            return;
        }
        pluginManager.onStop();
    }
    @Override
    public void handleDestroy() {
        if (!isInitialized()) {
            return;
        }
        // Cancel pending timeout timer.
        loadUrlTimeout++;

        // Forward to plugins
        this.pluginManager.onDestroy();

        // TODO: about:blank is a bit special (and the default URL for new frames)
        // We should use a blank data: url instead so it's more obvious
        this.loadUrl("about:blank");

        // TODO: Should not destroy webview until after about:blank is done loading.
        engine.destroy();
        hideCustomView();
    }

    protected class EngineClient implements CordovaWebViewEngine.Client {
        @Override
        public void clearLoadTimeoutTimer() {
            loadUrlTimeout++;
        }

        @Override
        public void onPageStarted(String newUrl) {
            LOG.d(TAG, "onPageDidNavigate(" + newUrl + ")");
            boundKeyCodes.clear();
            pluginManager.onReset();
            pluginManager.postMessage("onPageStarted", newUrl);
        }

        @Override
        public void onReceivedError(int errorCode, String description, String failingUrl) {
            clearLoadTimeoutTimer();
            JSONObject data = new JSONObject();
            try {
                data.put("errorCode", errorCode);
                data.put("description", description);
                data.put("url", failingUrl);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            pluginManager.postMessage("onReceivedError", data);
        }

        @Override
        public void onPageFinishedLoading(String url) {
            LOG.d(TAG, "onPageFinished(" + url + ")");

            clearLoadTimeoutTimer();

            // Broadcast message that page has loaded
            pluginManager.postMessage("onPageFinished", url);

            // Make app visible after 2 sec in case there was a JS error and Cordova JS never initialized correctly
            if (engine.getView().getVisibility() != View.VISIBLE) {
                Thread t = new Thread(new Runnable() {
                    public void run() {
                        try {
                            Thread.sleep(2000);
                            cordova.getActivity().runOnUiThread(new Runnable() {
                                public void run() {
                                    pluginManager.postMessage("spinner", "stop");
                                }
                            });
                        } catch (InterruptedException e) {
                        }
                    }
                });
                t.start();
            }

            // Shutdown if blank loaded
            if (url.equals("about:blank")) {
                pluginManager.postMessage("exit", null);
            }
        }

        @Override
        public Boolean onDispatchKeyEvent(KeyEvent event) {
            int keyCode = event.getKeyCode();
            boolean isBackButton = keyCode == KeyEvent.KEYCODE_BACK;
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                if (isBackButton && mCustomView != null) {
                    return true;
                } else if (boundKeyCodes.contains(keyCode)) {
                    return true;
                } else if (isBackButton) {
                    return engine.canGoBack();
                }
            } else if (event.getAction() == KeyEvent.ACTION_UP) {
                if (isBackButton && mCustomView != null) {
                    hideCustomView();
                    return true;
                } else if (boundKeyCodes.contains(keyCode)) {
                    String eventName = null;
                    switch (keyCode) {
                        case KeyEvent.KEYCODE_VOLUME_DOWN:
                            eventName = "volumedownbutton";
                            break;
                        case KeyEvent.KEYCODE_VOLUME_UP:
                            eventName = "volumeupbutton";
                            break;
                        case KeyEvent.KEYCODE_SEARCH:
                            eventName = "searchbutton";
                            break;
                        case KeyEvent.KEYCODE_MENU:
                            eventName = "menubutton";
                            break;
                        case KeyEvent.KEYCODE_BACK:
                            eventName = "backbutton";
                            break;
                    }
                    if (eventName != null) {
                        sendJavascriptEvent(eventName);
                        return true;
                    }
                } else if (isBackButton) {
                    return engine.goBack();
                }
            }
            return null;
        }

        @Override
        public boolean onNavigationAttempt(String url) {
            // Give plugins the chance to handle the url
            if (pluginManager.onOverrideUrlLoading(url)) {
                return true;
            } else if (pluginManager.shouldAllowNavigation(url)) {
                return false;
            } else if (pluginManager.shouldOpenExternalUrl(url)) {
                showWebPage(url, true, false, null);
                return true;
            }
            LOG.w(TAG, "Blocked (possibly sub-frame) navigation to non-allowed URL: " + url);
            return true;
        }
    }
}
