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

import java.util.HashMap;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.Display;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.webkit.ValueCallback;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;

/**
 * This class is the main Android activity that represents the Cordova
 * application.  It should be extended by the user to load the specific
 * html file that contains the application.
 *
 * As an example:
 * 
 * <pre>
 *     package org.apache.cordova.examples;
 *
 *     import android.os.Bundle;
 *     import org.apache.cordova.*;
 *
 *     public class Example extends CordovaActivity {
 *       &#64;Override
 *       public void onCreate(Bundle savedInstanceState) {
 *         super.onCreate(savedInstanceState);
 *         super.init();
 *         // Load your application
 *         super.loadUrl(Config.getStartUrl());
 *       }
 *     }
 * </pre>
 * 
 * Cordova xml configuration: Cordova uses a configuration file at 
 * res/xml/config.xml to specify its settings. See "The config.xml File"
 * guide in cordova-docs at http://cordova.apache.org/docs for the documentation
 * for the configuration. The use of the set*Property() methods is
 * deprecated in favor of the config.xml file.
 *
 */
public class CordovaActivity extends Activity implements CordovaInterface {
    public static String TAG = "CordovaActivity";

    // The webview for our app
    protected CordovaWebView appView;
    protected CordovaWebViewClient webViewClient;

    protected LinearLayout root;
    protected boolean cancelLoadUrl = false;
    protected ProgressDialog spinnerDialog = null;
    private final ExecutorService threadPool = Executors.newCachedThreadPool();


    // The initial URL for our app
    // ie http://server/path/index.html#abc?query
    //private String url = null;

    private static int ACTIVITY_STARTING = 0;
    private static int ACTIVITY_RUNNING = 1;
    private static int ACTIVITY_EXITING = 2;
    private int activityState = 0;  // 0=starting, 1=running (after 1st resume), 2=shutting down

    // Plugin to call when activity result is received
    protected CordovaPlugin activityResultCallback = null;
    protected boolean activityResultKeepRunning;

    // Default background color for activity
    // (this is not the color for the webview, which is set in HTML)
    private int backgroundColor = Color.BLACK;

    /*
     * The variables below are used to cache some of the activity properties.
     */

    // Draw a splash screen using an image located in the drawable resource directory.
    // This is not the same as calling super.loadSplashscreen(url)
    protected int splashscreen = 0;
    protected int splashscreenTime = 3000;

    // LoadUrl timeout value in msec (default of 20 sec)
    protected int loadUrlTimeoutValue = 20000;

    // Keep app running when pause is received. (default = true)
    // If true, then the JavaScript and native code continue to run in the background
    // when another application (activity) is started.
    protected boolean keepRunning = true;

    private int lastRequestCode;

    private Object responseCode;

    private Intent lastIntent;

    private Object lastResponseCode;

    private String initCallbackClass;

    private Object LOG_TAG;

    /**
    * Sets the authentication token.
    *
    * @param authenticationToken
    * @param host
    * @param realm
    */
    public void setAuthenticationToken(AuthenticationToken authenticationToken, String host, String realm) {
        if (this.appView != null && this.appView.viewClient != null) {
            this.appView.viewClient.setAuthenticationToken(authenticationToken, host, realm);
        }
    }

    /**
     * Removes the authentication token.
     *
     * @param host
     * @param realm
     *
     * @return the authentication token or null if did not exist
     */
    public AuthenticationToken removeAuthenticationToken(String host, String realm) {
        if (this.appView != null && this.appView.viewClient != null) {
            return this.appView.viewClient.removeAuthenticationToken(host, realm);
        }
        return null;
    }

    /**
     * Gets the authentication token.
     *
     * In order it tries:
     * 1- host + realm
     * 2- host
     * 3- realm
     * 4- no host, no realm
     *
     * @param host
     * @param realm
     *
     * @return the authentication token
     */
    public AuthenticationToken getAuthenticationToken(String host, String realm) {
        if (this.appView != null && this.appView.viewClient != null) {
            return this.appView.viewClient.getAuthenticationToken(host, realm);
        }
        return null;
    }

    /**
     * Clear all authentication tokens.
     */
    public void clearAuthenticationTokens() {
        if (this.appView != null && this.appView.viewClient != null) {
            this.appView.viewClient.clearAuthenticationTokens();
        }
    }

    /**
     * Called when the activity is first created.
     *
     * @param savedInstanceState
     */
    @SuppressWarnings("deprecation")
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Config.init(this);
        LOG.d(TAG, "CordovaActivity.onCreate()");
        super.onCreate(savedInstanceState);

        if(savedInstanceState != null)
        {
            initCallbackClass = savedInstanceState.getString("callbackClass");
        }
        
        if(!this.getBooleanProperty("ShowTitle", false))
        {
            getWindow().requestFeature(Window.FEATURE_NO_TITLE);
        }

        if(this.getBooleanProperty("SetFullscreen", false))
        {
            Log.d(TAG, "The SetFullscreen configuration is deprecated in favor of Fullscreen, and will be removed in a future version.");
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }
        else
        {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        }
        // This builds the view.  We could probably get away with NOT having a LinearLayout, but I like having a bucket!
        Display display = getWindowManager().getDefaultDisplay();
        int width = display.getWidth();
        int height = display.getHeight();

        root = new LinearLayoutSoftKeyboardDetect(this, width, height);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(this.backgroundColor);
        root.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT, 0.0F));

        // Setup the hardware volume controls to handle volume control
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
    }

    /**
     * Get the Android activity.
     *
     * @return the Activity
     */
    public Activity getActivity() {
        return this;
    }

    /**
     * Construct the default web view object.
     *
     * This is intended to be overridable by subclasses of CordovaIntent which
     * require a more specialized web view.
     */
    protected CordovaWebView makeWebView() {
        return new CordovaWebView(CordovaActivity.this);
    }

    /**
     * Construct the client for the default web view object.
     *
     * This is intended to be overridable by subclasses of CordovaIntent which
     * require a more specialized web view.
     *
     * @param webView the default constructed web view object
     */
    protected CordovaWebViewClient makeWebViewClient(CordovaWebView webView) {
        if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB) {
            return new CordovaWebViewClient(this, webView);
        } else {
            return new IceCreamCordovaWebViewClient(this, webView);
        }
    }

    /**
     * Construct the chrome client for the default web view object.
     *
     * This is intended to be overridable by subclasses of CordovaIntent which
     * require a more specialized web view.
     *
     * @param webView the default constructed web view object
     */
    protected CordovaChromeClient makeChromeClient(CordovaWebView webView) {
        return new CordovaChromeClient(this, webView);
    }

    /**
     * Create and initialize web container with default web view objects.
     */
    public void init() {
        CordovaWebView webView = makeWebView();
        this.init(webView, makeWebViewClient(webView), makeChromeClient(webView));
    }

    /**
     * Initialize web container with web view objects.
     *
     * @param webView
     * @param webViewClient
     * @param webChromeClient
     */
    @SuppressLint("NewApi")
    public void init(CordovaWebView webView, CordovaWebViewClient webViewClient, CordovaChromeClient webChromeClient) {
        LOG.d(TAG, "CordovaActivity.init()");

        // Set up web container
        this.appView = webView;
        this.appView.setId(100);

        this.appView.setWebViewClient(webViewClient);
        this.appView.setWebChromeClient(webChromeClient);
        webViewClient.setWebView(this.appView);
        webChromeClient.setWebView(this.appView);

        this.appView.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
                1.0F));

        if (this.getBooleanProperty("DisallowOverscroll", false)) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.GINGERBREAD) {
                this.appView.setOverScrollMode(CordovaWebView.OVER_SCROLL_NEVER);
            }
        }

        // Add web view but make it invisible while loading URL
        this.appView.setVisibility(View.INVISIBLE);
        this.root.addView(this.appView);
        setContentView(this.root);

        // Clear cancel flag
        this.cancelLoadUrl = false;
        
    }

    /**
     * Load the url into the webview.
     *
     * @param url
     */
    public void loadUrl(String url) {

        // Init web view if not already done
        if (this.appView == null) {
            this.init();
        }

        this.splashscreenTime = this.getIntegerProperty("SplashScreenDelay", this.splashscreenTime);
        if(this.splashscreenTime > 0)
        {
            this.splashscreen = this.getIntegerProperty("SplashScreen", 0);
            if(this.splashscreen != 0)
            {
                this.showSplashScreen(this.splashscreenTime);
            }
        }
        
        // Set backgroundColor
        this.backgroundColor = this.getIntegerProperty("BackgroundColor", Color.BLACK);
        this.root.setBackgroundColor(this.backgroundColor);

        // If keepRunning
        this.keepRunning = this.getBooleanProperty("KeepRunning", true);

        //Check if the view is attached to anything
        if(appView.getParent() != null)
        {
            // Then load the spinner
            this.loadSpinner();
        }
        //Load the correct splashscreen
        
        if(this.splashscreen != 0)
        {
            this.appView.loadUrl(url, this.splashscreenTime);
        }
        else
        {
            this.appView.loadUrl(url);
        }
    }

    /**
     * Load the url into the webview after waiting for period of time.
     * This is used to display the splashscreen for certain amount of time.
     *
     * @param url
     * @param time              The number of ms to wait before loading webview
     */
    public void loadUrl(final String url, int time) {

        this.splashscreenTime = time;
        this.loadUrl(url);
        
        /*
        // Init web view if not already done
        if (this.appView == null) {
            this.init();
        }

        this.splashscreenTime = time;
        this.splashscreen = this.getIntegerProperty("SplashScreen", 0);
        this.showSplashScreen(this.splashscreenTime);
        this.appView.loadUrl(url, time);
        */
    }
    
    /*
     * Load the spinner
     */
    void loadSpinner() {

        // If loadingDialog property, then show the App loading dialog for first page of app
        String loading = null;
        if ((this.appView == null) || !this.appView.canGoBack()) {
            loading = this.getStringProperty("LoadingDialog", null);
        }
        else {
            loading = this.getStringProperty("LoadingPageDialog", null);
        }
        if (loading != null) {

            String title = "";
            String message = "Loading Application...";

            if (loading.length() > 0) {
                int comma = loading.indexOf(',');
                if (comma > 0) {
                    title = loading.substring(0, comma);
                    message = loading.substring(comma + 1);
                }
                else {
                    title = "";
                    message = loading;
                }
            }
            this.spinnerStart(title, message);
        }
    }


    /**
     * Cancel loadUrl before it has been loaded.
     */
    // TODO NO-OP
    @Deprecated
    public void cancelLoadUrl() {
        this.cancelLoadUrl = true;
    }

    /**
     * Clear the resource cache.
     */
    public void clearCache() {
        if (this.appView == null) {
            this.init();
        }
        this.appView.clearCache(true);
    }

    /**
     * Clear web history in this web view.
     */
    public void clearHistory() {
        this.appView.clearHistory();
    }

    /**
     * Go to previous page in history.  (We manage our own history)
     *
     * @return true if we went back, false if we are already at top
     */
    public boolean backHistory() {
        if (this.appView != null) {
            return appView.backHistory();
        }
        return false;
    }

    @Override
    /**
     * Called by the system when the device configuration changes while your activity is running.
     *
     * @param Configuration newConfig
     */
    public void onConfigurationChanged(Configuration newConfig) {
        //don't reload the current page when the orientation is changed
        super.onConfigurationChanged(newConfig);
    }

    /**
     * Get boolean property for activity.
     *
     * @param name
     * @param defaultValue
     * @return the boolean value of the named property
     */
    public boolean getBooleanProperty(String name, boolean defaultValue) {
        Bundle bundle = this.getIntent().getExtras();
        if (bundle == null) {
            return defaultValue;
        }
        name = name.toLowerCase(Locale.getDefault());
        Boolean p;
        try {
            p = (Boolean) bundle.get(name);
        } catch (ClassCastException e) {
            String s = bundle.get(name).toString();
            if ("true".equals(s)) {
                p = true;
            }
            else {
                p = false;
            }
        }
        if (p == null) {
            return defaultValue;
        }
        return p.booleanValue();
    }

    /**
     * Get int property for activity.
     *
     * @param name
     * @param defaultValue
     * @return the int value for the named property
     */
    public int getIntegerProperty(String name, int defaultValue) {
        Bundle bundle = this.getIntent().getExtras();
        if (bundle == null) {
            return defaultValue;
        }
        name = name.toLowerCase(Locale.getDefault());
        Integer p;
        try {
            p = (Integer) bundle.get(name);
        } catch (ClassCastException e) {
            p = Integer.parseInt(bundle.get(name).toString());
        }
        if (p == null) {
            return defaultValue;
        }
        return p.intValue();
    }

    /**
     * Get string property for activity.
     *
     * @param name
     * @param defaultValue
     * @return the String value for the named property
     */
    public String getStringProperty(String name, String defaultValue) {
        Bundle bundle = this.getIntent().getExtras();
        if (bundle == null) {
            return defaultValue;
        }
        name = name.toLowerCase(Locale.getDefault());
        String p = bundle.getString(name);
        if (p == null) {
            return defaultValue;
        }
        return p;
    }

    /**
     * Get double property for activity.
     *
     * @param name
     * @param defaultValue
     * @return the double value for the named property
     */
    public double getDoubleProperty(String name, double defaultValue) {
        Bundle bundle = this.getIntent().getExtras();
        if (bundle == null) {
            return defaultValue;
        }
        name = name.toLowerCase(Locale.getDefault());
        Double p;
        try {
            p = (Double) bundle.get(name);
        } catch (ClassCastException e) {
            p = Double.parseDouble(bundle.get(name).toString());
        }
        if (p == null) {
            return defaultValue;
        }
        return p.doubleValue();
    }

    /**
     * Set boolean property on activity.
     * This method has been deprecated in 3.0 and will be removed at a future
     * time. Please use config.xml instead.
     *
     * @param name
     * @param value
     * @deprecated
     */
    @Deprecated
    public void setBooleanProperty(String name, boolean value) {
        Log.d(TAG, "Setting boolean properties in CordovaActivity will be deprecated in 3.0 on July 2013, please use config.xml");
        this.getIntent().putExtra(name.toLowerCase(), value);
    }

    /**
     * Set int property on activity.
     * This method has been deprecated in 3.0 and will be removed at a future
     * time. Please use config.xml instead.
     *
     * @param name
     * @param value
     * @deprecated
     */
    @Deprecated
    public void setIntegerProperty(String name, int value) {
        Log.d(TAG, "Setting integer properties in CordovaActivity will be deprecated in 3.0 on July 2013, please use config.xml");
        this.getIntent().putExtra(name.toLowerCase(), value);
    }

    /**
     * Set string property on activity.
     * This method has been deprecated in 3.0 and will be removed at a future
     * time. Please use config.xml instead.
     *
     * @param name
     * @param value
     * @deprecated
     */
    @Deprecated
    public void setStringProperty(String name, String value) {
        Log.d(TAG, "Setting string properties in CordovaActivity will be deprecated in 3.0 on July 2013, please use config.xml");
        this.getIntent().putExtra(name.toLowerCase(), value);
    }

    /**
     * Set double property on activity.
     * This method has been deprecated in 3.0 and will be removed at a future
     * time. Please use config.xml instead.
     *
     * @param name
     * @param value
     * @deprecated
     */
    @Deprecated
    public void setDoubleProperty(String name, double value) {
        Log.d(TAG, "Setting double properties in CordovaActivity will be deprecated in 3.0 on July 2013, please use config.xml");
        this.getIntent().putExtra(name.toLowerCase(), value);
    }

    @Override
    /**
     * Called when the system is about to start resuming a previous activity.
     */
    protected void onPause() {
        super.onPause();

        LOG.d(TAG, "Paused the application!");

        // Don't process pause if shutting down, since onDestroy() will be called
        if (this.activityState == ACTIVITY_EXITING) {
            return;
        }

        if (this.appView == null) {
            return;
        }
        else
        {
            this.appView.handlePause(this.keepRunning);
        }

        // hide the splash screen to avoid leaking a window
        this.removeSplashScreen();
    }

    @Override
    /**
     * Called when the activity receives a new intent
     **/
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        //Forward to plugins
        if (this.appView != null)
           this.appView.onNewIntent(intent);
    }

    @Override
    /**
     * Called when the activity will start interacting with the user.
     */
    protected void onResume() {
        super.onResume();
        //Reload the configuration
        Config.init(this);

        LOG.d(TAG, "Resuming the App");
        

        //Code to test CB-3064
        String errorUrl = this.getStringProperty("ErrorUrl", null);
        LOG.d(TAG, "CB-3064: The errorUrl is " + errorUrl);
          
        if (this.activityState == ACTIVITY_STARTING) {
            this.activityState = ACTIVITY_RUNNING;
            return;
        }

        if (this.appView == null) {
            return;
        }

        this.appView.handleResume(this.keepRunning, this.activityResultKeepRunning);

        // If app doesn't want to run in background
        if (!this.keepRunning || this.activityResultKeepRunning) {

            // Restore multitasking state
            if (this.activityResultKeepRunning) {
                this.keepRunning = this.activityResultKeepRunning;
                this.activityResultKeepRunning = false;
            }
        }
    }

    @Override
    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
        LOG.d(TAG, "CordovaActivity.onDestroy()");
        super.onDestroy();

        // hide the splash screen to avoid leaking a window
        this.removeSplashScreen();

        if (this.appView != null) {
            appView.handleDestroy();
        }
        else {
            this.activityState = ACTIVITY_EXITING; 
        }
    }

    /**
     * Send a message to all plugins.
     *
     * @param id            The message id
     * @param data          The message data
     */
    public void postMessage(String id, Object data) {
        if (this.appView != null) {
            this.appView.postMessage(id, data);
        }
    }

    /**
     * @deprecated
     * Add services to res/xml/plugins.xml instead.
     *
     * Add a class that implements a service.
     *
     * @param serviceType
     * @param className
     */
    @Deprecated
    public void addService(String serviceType, String className) {
        if (this.appView != null && this.appView.pluginManager != null) {
            this.appView.pluginManager.addService(serviceType, className);
        }
    }

    /**
     * Send JavaScript statement back to JavaScript.
     * (This is a convenience method)
     *
     * @param statement
     */
    public void sendJavascript(String statement) {
        if (this.appView != null) {
            this.appView.jsMessageQueue.addJavaScript(statement);
        }
    }

    /**
     * Show the spinner.  Must be called from the UI thread.
     *
     * @param title         Title of the dialog
     * @param message       The message of the dialog
     */
    public void spinnerStart(final String title, final String message) {
        if (this.spinnerDialog != null) {
            this.spinnerDialog.dismiss();
            this.spinnerDialog = null;
        }
        final CordovaActivity me = this;
        this.spinnerDialog = ProgressDialog.show(CordovaActivity.this, title, message, true, true,
                new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface dialog) {
                        me.spinnerDialog = null;
                    }
                });
    }

    /**
     * Stop spinner - Must be called from UI thread
     */
    public void spinnerStop() {
        if (this.spinnerDialog != null && this.spinnerDialog.isShowing()) {
            this.spinnerDialog.dismiss();
            this.spinnerDialog = null;
        }
    }

    /**
     * End this activity by calling finish for activity
     */
    public void endActivity() {
        this.activityState = ACTIVITY_EXITING;
        super.finish();
    }


    /**
     * Launch an activity for which you would like a result when it finished. When this activity exits,
     * your onActivityResult() method will be called.
     *
     * @param command           The command object
     * @param intent            The intent to start
     * @param requestCode       The request code that is passed to callback to identify the activity
     */
    public void startActivityForResult(CordovaPlugin command, Intent intent, int requestCode) {
        this.activityResultCallback = command;
        this.activityResultKeepRunning = this.keepRunning;

        // If multitasking turned on, then disable it for activities that return results
        if (command != null) {
            this.keepRunning = false;
        }

        // Start activity
        super.startActivityForResult(intent, requestCode);
    }

    @Override
    /**
     * Called when an activity you launched exits, giving you the requestCode you started it with,
     * the resultCode it returned, and any additional data from it.
     *
     * @param requestCode       The request code originally supplied to startActivityForResult(),
     *                          allowing you to identify who this result came from.
     * @param resultCode        The integer result code returned by the child activity through its setResult().
     * @param data              An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     */
    protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        LOG.d(TAG, "Incoming Result");
        super.onActivityResult(requestCode, resultCode, intent);
        Log.d(TAG, "Request code = " + requestCode);
        if (appView != null && requestCode == CordovaChromeClient.FILECHOOSER_RESULTCODE) {
        	ValueCallback<Uri> mUploadMessage = this.appView.getWebChromeClient().getValueCallback();
            Log.d(TAG, "did we get here?");
            if (null == mUploadMessage)
                return;
            Uri result = intent == null || resultCode != Activity.RESULT_OK ? null : intent.getData();
            Log.d(TAG, "result = " + result);
//            Uri filepath = Uri.parse("file://" + FileUtils.getRealPathFromURI(result, this));
//            Log.d(TAG, "result = " + filepath);
            mUploadMessage.onReceiveValue(result);
            mUploadMessage = null;
        }
        CordovaPlugin callback = this.activityResultCallback;
        if(callback == null && initCallbackClass != null) {
            // The application was restarted, but had defined an initial callback
            // before being shut down.
            this.activityResultCallback = appView.pluginManager.getPlugin(initCallbackClass);
            callback = this.activityResultCallback;
        }
        if(callback != null) {
            LOG.d(TAG, "We have a callback to send this result to");
            callback.onActivityResult(requestCode, resultCode, intent);
        }
    }

    public void setActivityResultCallback(CordovaPlugin plugin) {
        this.activityResultCallback = plugin;
    }

    /**
     * Report an error to the host application. These errors are unrecoverable (i.e. the main resource is unavailable).
     * The errorCode parameter corresponds to one of the ERROR_* constants.
     *
     * @param errorCode    The error code corresponding to an ERROR_* value.
     * @param description  A String describing the error.
     * @param failingUrl   The url that failed to load.
     */
    public void onReceivedError(final int errorCode, final String description, final String failingUrl) {
        final CordovaActivity me = this;

        // If errorUrl specified, then load it
        final String errorUrl = me.getStringProperty("errorUrl", null);
        if ((errorUrl != null) && (errorUrl.startsWith("file://") || Config.isUrlWhiteListed(errorUrl)) && (!failingUrl.equals(errorUrl))) {

            // Load URL on UI thread
            me.runOnUiThread(new Runnable() {
                public void run() {
                    // Stop "app loading" spinner if showing
                    me.spinnerStop();
                    me.appView.showWebPage(errorUrl, false, true, null);
                }
            });
        }
        // If not, then display error dialog
        else {
            final boolean exit = !(errorCode == WebViewClient.ERROR_HOST_LOOKUP);
            me.runOnUiThread(new Runnable() {
                public void run() {
                    if (exit) {
                        me.appView.setVisibility(View.GONE);
                        me.displayError("Application Error", description + " (" + failingUrl + ")", "OK", exit);
                    }
                }
            });
        }
    }

    /**
     * Display an error dialog and optionally exit application.
     *
     * @param title
     * @param message
     * @param button
     * @param exit
     */
    public void displayError(final String title, final String message, final String button, final boolean exit) {
        final CordovaActivity me = this;
        me.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    AlertDialog.Builder dlg = new AlertDialog.Builder(me);
                    dlg.setMessage(message);
                    dlg.setTitle(title);
                    dlg.setCancelable(false);
                    dlg.setPositiveButton(button,
                            new AlertDialog.OnClickListener() {
                                public void onClick(DialogInterface dialog, int which) {
                                    dialog.dismiss();
                                    if (exit) {
                                        me.endActivity();
                                    }
                                }
                            });
                    dlg.create();
                    dlg.show();
                } catch (Exception e) {
                    finish();
                }
            }
        });
    }

    /**
     * Determine if URL is in approved list of URLs to load.
     *
     * @param url
     * @return true if the url is whitelisted
     */
    public boolean isUrlWhiteListed(String url) {
        return Config.isUrlWhiteListed(url);
    }

    /*
     * Hook in Cordova for menu plugins
     *
     */
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        this.postMessage("onCreateOptionsMenu", menu);
        return super.onCreateOptionsMenu(menu);
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        this.postMessage("onPrepareOptionsMenu", menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        this.postMessage("onOptionsItemSelected", item);
        return true;
    }

    /**
     * Get Activity context.
     *
     * @return self
     * @deprecated
     */
    @Deprecated
    public Context getContext() {
        LOG.d(TAG, "This will be deprecated December 2012");
        return this;
    }

    /**
     * Load the specified URL in the Cordova webview or a new browser instance.
     *
     * NOTE: If openExternal is false, only URLs listed in whitelist can be loaded.
     *
     * @param url           The url to load.
     * @param openExternal  Load url in browser instead of Cordova webview.
     * @param clearHistory  Clear the history stack, so new page becomes top of history
     * @param params        Parameters for new app
     */
    public void showWebPage(String url, boolean openExternal, boolean clearHistory, HashMap<String, Object> params) {
        if (this.appView != null) {
            appView.showWebPage(url, openExternal, clearHistory, params);
        }
    }

    protected Dialog splashDialog;

    /**
     * Removes the Dialog that displays the splash screen
     */
    public void removeSplashScreen() {
        if (splashDialog != null && splashDialog.isShowing()) {
            splashDialog.dismiss();
            splashDialog = null;
        }
    }

    /**
     * Shows the splash screen over the full Activity
     */
    @SuppressWarnings("deprecation")
    protected void showSplashScreen(final int time) {
        final CordovaActivity that = this;

        Runnable runnable = new Runnable() {
            public void run() {
                // Get reference to display
                Display display = getWindowManager().getDefaultDisplay();

                // Create the layout for the dialog
                LinearLayout root = new LinearLayout(that.getActivity());
                root.setMinimumHeight(display.getHeight());
                root.setMinimumWidth(display.getWidth());
                root.setOrientation(LinearLayout.VERTICAL);
                root.setBackgroundColor(that.getIntegerProperty("backgroundColor", Color.BLACK));
                root.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT, 0.0F));
                root.setBackgroundResource(that.splashscreen);
                
                // Create and show the dialog
                splashDialog = new Dialog(that, android.R.style.Theme_Translucent_NoTitleBar);
                // check to see if the splash screen should be full screen
                if ((getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_FULLSCREEN)
                        == WindowManager.LayoutParams.FLAG_FULLSCREEN) {
                    splashDialog.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                            WindowManager.LayoutParams.FLAG_FULLSCREEN);
                }
                splashDialog.setContentView(root);
                splashDialog.setCancelable(false);
                splashDialog.show();

                // Set Runnable to remove splash screen just in case
                final Handler handler = new Handler();
                handler.postDelayed(new Runnable() {
                    public void run() {
                        removeSplashScreen();
                    }
                }, time);
            }
        };
        this.runOnUiThread(runnable);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event)
    {
        if (appView != null && (appView.isCustomViewShowing() || appView.getFocusedChild() != null ) &&
                (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_MENU)) {
            return appView.onKeyUp(keyCode, event);
        } else {
            return super.onKeyUp(keyCode, event);
    	}
    }
    
    /*
     * Android 2.x needs to be able to check where the cursor is.  Android 4.x does not
     * 
     * (non-Javadoc)
     * @see android.app.Activity#onKeyDown(int, android.view.KeyEvent)
     */
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event)
    {
        //Determine if the focus is on the current view or not
        if (appView != null && appView.getFocusedChild() != null && (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_MENU)) {
                    return appView.onKeyDown(keyCode, event);
        }
        else
            return super.onKeyDown(keyCode, event);
    }
    
    
    /**
     * Called when a message is sent to plugin.
     *
     * @param id            The message id
     * @param data          The message data
     * @return              Object or null
     */
    public Object onMessage(String id, Object data) {
        if (!"onScrollChanged".equals(id)) {
            LOG.d(TAG, "onMessage(" + id + "," + data + ")");
        }

        if ("splashscreen".equals(id)) {
            if ("hide".equals(data.toString())) {
                this.removeSplashScreen();
            }
            else {
                // If the splash dialog is showing don't try to show it again
                if (this.splashDialog == null || !this.splashDialog.isShowing()) {
                    this.splashscreen = this.getIntegerProperty("SplashScreen", 0);
                    this.showSplashScreen(this.splashscreenTime);
                }
            }
        }
        else if ("spinner".equals(id)) {
            if ("stop".equals(data.toString())) {
                this.spinnerStop();
                this.appView.setVisibility(View.VISIBLE);
            }
        }
        else if ("onReceivedError".equals(id)) {
            JSONObject d = (JSONObject) data;
            try {
                this.onReceivedError(d.getInt("errorCode"), d.getString("description"), d.getString("url"));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        else if ("exit".equals(id)) {
            this.endActivity();
        }
        return null;
    }

    public ExecutorService getThreadPool() {
        return threadPool;
    }
    
    protected void onSaveInstanceState(Bundle outState)
    {
        super.onSaveInstanceState(outState);
        if(this.activityResultCallback != null)
        {
            String cClass = this.activityResultCallback.getClass().getName();
            outState.putString("callbackClass", cClass);
        }
    }
}
