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

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;

import org.apache.cordova.Config;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginManager;
import org.apache.cordova.PluginResult;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.AttributeSet;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebBackForwardList;
import android.webkit.WebHistoryItem;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebSettings.LayoutAlgorithm;
import android.widget.FrameLayout;

/*
 * This class is our web view.
 *
 * @see <a href="http://developer.android.com/guide/webapps/webview.html">WebView guide</a>
 * @see <a href="http://developer.android.com/reference/android/webkit/WebView.html">WebView</a>
 */
public class CordovaWebView extends WebView {

    public static final String TAG = "CordovaWebView";
    public static final String CORDOVA_VERSION = "3.5.0";

    private ArrayList<Integer> keyDownCodes = new ArrayList<Integer>();
    private ArrayList<Integer> keyUpCodes = new ArrayList<Integer>();

    public PluginManager pluginManager;
    private boolean paused;

    private BroadcastReceiver receiver;


    /** Activities and other important classes **/
    private CordovaInterface cordova;
    CordovaWebViewClient viewClient;
    @SuppressWarnings("unused")
    private CordovaChromeClient chromeClient;

    private String url;

    // Flag to track that a loadUrl timeout occurred
    int loadUrlTimeout = 0;

    private boolean bound;

    private boolean handleButton = false;
    
    private long lastMenuEventTime = 0;

    NativeToJsMessageQueue jsMessageQueue;
    ExposedJsApi exposedJsApi;

    /** custom view created by the browser (a video player for example) */
    private View mCustomView;
    private WebChromeClient.CustomViewCallback mCustomViewCallback;

    private ActivityResult mResult = null;

    private CordovaResourceApi resourceApi;

    class ActivityResult {
        
        int request;
        int result;
        Intent incoming;
        
        public ActivityResult(int req, int res, Intent intent) {
            request = req;
            result = res;
            incoming = intent;
        }

        
    }
    
    static final FrameLayout.LayoutParams COVER_SCREEN_GRAVITY_CENTER =
            new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
            Gravity.CENTER);
    
    /**
     * Constructor.
     *
     * @param context
     */
    public CordovaWebView(Context context) {
        super(context);
        if (CordovaInterface.class.isInstance(context))
        {
            this.cordova = (CordovaInterface) context;
        }
        else
        {
            Log.d(TAG, "Your activity must implement CordovaInterface to work");
        }
        this.loadConfiguration();
        this.setup();
    }

    /**
     * Constructor.
     *
     * @param context
     * @param attrs
     */
    public CordovaWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        if (CordovaInterface.class.isInstance(context))
        {
            this.cordova = (CordovaInterface) context;
        }
        else
        {
            Log.d(TAG, "Your activity must implement CordovaInterface to work");
        }
        this.setWebChromeClient(new CordovaChromeClient(this.cordova, this));
        this.initWebViewClient(this.cordova);
        this.loadConfiguration();
        this.setup();
    }

    /**
     * Constructor.
     *
     * @param context
     * @param attrs
     * @param defStyle
     *
     */
    public CordovaWebView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        if (CordovaInterface.class.isInstance(context))
        {
            this.cordova = (CordovaInterface) context;
        }
        else
        {
            Log.d(TAG, "Your activity must implement CordovaInterface to work");
        }
        this.setWebChromeClient(new CordovaChromeClient(this.cordova, this));
        this.loadConfiguration();
        this.setup();
    }

    /**
     * Constructor.
     *
     * @param context
     * @param attrs
     * @param defStyle
     * @param privateBrowsing
     */
    @TargetApi(11)
    public CordovaWebView(Context context, AttributeSet attrs, int defStyle, boolean privateBrowsing) {
        super(context, attrs, defStyle, privateBrowsing);
        if (CordovaInterface.class.isInstance(context))
        {
            this.cordova = (CordovaInterface) context;
        }
        else
        {
            Log.d(TAG, "Your activity must implement CordovaInterface to work");
        }
        this.setWebChromeClient(new CordovaChromeClient(this.cordova));
        this.initWebViewClient(this.cordova);
        this.loadConfiguration();
        this.setup();
    }

    /**
     * set the WebViewClient, but provide special case handling for IceCreamSandwich.
     */
    private void initWebViewClient(CordovaInterface cordova) {
        if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB ||
                android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.JELLY_BEAN_MR1)
        {
            this.setWebViewClient(new CordovaWebViewClient(this.cordova, this));
        }
        else
        {
            this.setWebViewClient(new IceCreamCordovaWebViewClient(this.cordova, this));
        }
    }

    /**
     * Initialize webview.
     */
    @SuppressWarnings("deprecation")
    @SuppressLint("NewApi")
    private void setup() {
        this.setInitialScale(0);
        this.setVerticalScrollBarEnabled(false);
        if (shouldRequestFocusOnInit()) {
			this.requestFocusFromTouch();
		}
		// Enable JavaScript
        WebSettings settings = this.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setLayoutAlgorithm(LayoutAlgorithm.NORMAL);
        
        // Set the nav dump for HTC 2.x devices (disabling for ICS, deprecated entirely for Jellybean 4.2)
        try {
            Method gingerbread_getMethod =  WebSettings.class.getMethod("setNavDump", new Class[] { boolean.class });
            
            String manufacturer = android.os.Build.MANUFACTURER;
            Log.d(TAG, "CordovaWebView is running on device made by: " + manufacturer);
            if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB &&
                    android.os.Build.MANUFACTURER.contains("HTC"))
            {
                gingerbread_getMethod.invoke(settings, true);
            }
        } catch (NoSuchMethodException e) {
            Log.d(TAG, "We are on a modern version of Android, we will deprecate HTC 2.3 devices in 2.8");
        } catch (IllegalArgumentException e) {
            Log.d(TAG, "Doing the NavDump failed with bad arguments");
        } catch (IllegalAccessException e) {
            Log.d(TAG, "This should never happen: IllegalAccessException means this isn't Android anymore");
        } catch (InvocationTargetException e) {
            Log.d(TAG, "This should never happen: InvocationTargetException means this isn't Android anymore.");
        }

        //We don't save any form data in the application
        settings.setSaveFormData(false);
        settings.setSavePassword(false);
        
        // Jellybean rightfully tried to lock this down. Too bad they didn't give us a whitelist
        // while we do this
        if (android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.ICE_CREAM_SANDWICH_MR1)
            Level16Apis.enableUniversalAccess(settings);
        // Enable database
        // We keep this disabled because we use or shim to get around DOM_EXCEPTION_ERROR_16
        String databasePath = this.cordova.getActivity().getApplicationContext().getDir("database", Context.MODE_PRIVATE).getPath();
        settings.setDatabaseEnabled(true);
        settings.setDatabasePath(databasePath);
        
        
        //Determine whether we're in debug or release mode, and turn on Debugging!
        try {
            final String packageName = this.cordova.getActivity().getPackageName();
            final PackageManager pm = this.cordova.getActivity().getPackageManager();
            ApplicationInfo appInfo;
            
            appInfo = pm.getApplicationInfo(packageName, PackageManager.GET_META_DATA);
            
            if((appInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0 &&  
                android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT)
            {
                setWebContentsDebuggingEnabled(true);
            }
        } catch (IllegalArgumentException e) {
            Log.d(TAG, "You have one job! To turn on Remote Web Debugging! YOU HAVE FAILED! ");
            e.printStackTrace();
        } catch (NameNotFoundException e) {
            Log.d(TAG, "This should never happen: Your application's package can't be found.");
            e.printStackTrace();
        }  
        
        settings.setGeolocationDatabasePath(databasePath);

        // Enable DOM storage
        settings.setDomStorageEnabled(true);

        // Enable built-in geolocation
        settings.setGeolocationEnabled(true);
        
        // Enable AppCache
        // Fix for CB-2282
        settings.setAppCacheMaxSize(5 * 1048576);
        String pathToCache = this.cordova.getActivity().getApplicationContext().getDir("database", Context.MODE_PRIVATE).getPath();
        settings.setAppCachePath(pathToCache);
        settings.setAppCacheEnabled(true);
        
        // Fix for CB-1405
        // Google issue 4641
        this.updateUserAgentString();
        
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(Intent.ACTION_CONFIGURATION_CHANGED);
        if (this.receiver == null) {
            this.receiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    updateUserAgentString();
                }
            };
            this.cordova.getActivity().registerReceiver(this.receiver, intentFilter);
        }
        // end CB-1405

        pluginManager = new PluginManager(this, this.cordova);
        jsMessageQueue = new NativeToJsMessageQueue(this, cordova);
        exposedJsApi = new ExposedJsApi(pluginManager, jsMessageQueue);
        resourceApi = new CordovaResourceApi(this.getContext(), pluginManager);
        exposeJsInterface();
    }

	/**
	 * Override this method to decide whether or not you need to request the
	 * focus when your application start
	 * 
	 * @return true unless this method is overriden to return a different value
	 */
    protected boolean shouldRequestFocusOnInit() {
		return true;
	}

	private void updateUserAgentString() {
        this.getSettings().getUserAgentString();
    }

    private void exposeJsInterface() {
        int SDK_INT = Build.VERSION.SDK_INT;
        if ((SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR1)) {
            Log.i(TAG, "Disabled addJavascriptInterface() bridge since Android version is old.");
            // Bug being that Java Strings do not get converted to JS strings automatically.
            // This isn't hard to work-around on the JS side, but it's easier to just
            // use the prompt bridge instead.
            return;            
        } 
        this.addJavascriptInterface(exposedJsApi, "_cordovaNative");
    }

    /**
     * Set the WebViewClient.
     *
     * @param client
     */
    public void setWebViewClient(CordovaWebViewClient client) {
        this.viewClient = client;
        super.setWebViewClient(client);
    }

    /**
     * Set the WebChromeClient.
     *
     * @param client
     */
    public void setWebChromeClient(CordovaChromeClient client) {
        this.chromeClient = client;
        super.setWebChromeClient(client);
    }
    
    public CordovaChromeClient getWebChromeClient() {
        return this.chromeClient;
    }

    /**
     * Load the url into the webview.
     *
     * @param url
     */
    @Override
    public void loadUrl(String url) {
        if (url.equals("about:blank") || url.startsWith("javascript:")) {
            this.loadUrlNow(url);
        }
        else {

            String initUrl = this.getProperty("url", null);

            // If first page of app, then set URL to load to be the one passed in
            if (initUrl == null) {
                this.loadUrlIntoView(url);
            }
            // Otherwise use the URL specified in the activity's extras bundle
            else {
                this.loadUrlIntoView(initUrl);
            }
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
        String initUrl = this.getProperty("url", null);

        // If first page of app, then set URL to load to be the one passed in
        if (initUrl == null) {
            this.loadUrlIntoView(url, time);
        }
        // Otherwise use the URL specified in the activity's extras bundle
        else {
            this.loadUrlIntoView(initUrl);
        }
    }

    public void loadUrlIntoView(final String url) {
        loadUrlIntoView(url, true);
    }

    /**
     * Load the url into the webview.
     *
     * @param url
     */
    public void loadUrlIntoView(final String url, boolean recreatePlugins) {
        LOG.d(TAG, ">>> loadUrl(" + url + ")");

        if (recreatePlugins) {
            this.url = url;
            this.pluginManager.init();
        }

        // Create a timeout timer for loadUrl
        final CordovaWebView me = this;
        final int currentLoadUrlTimeout = me.loadUrlTimeout;
        final int loadUrlTimeoutValue = Integer.parseInt(this.getProperty("LoadUrlTimeoutValue", "20000"));

        // Timeout error method
        final Runnable loadError = new Runnable() {
            public void run() {
                me.stopLoading();
                LOG.e(TAG, "CordovaWebView: TIMEOUT ERROR!");
                if (viewClient != null) {
                    viewClient.onReceivedError(me, -6, "The connection to the server was unsuccessful.", url);
                }
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
                if (me.loadUrlTimeout == currentLoadUrlTimeout) {
                    me.cordova.getActivity().runOnUiThread(loadError);
                }
            }
        };

        // Load url
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                cordova.getThreadPool().execute(timeoutCheck);
                me.loadUrlNow(url);
            }
        });
    }

    /**
     * Load URL in webview.
     *
     * @param url
     */
    void loadUrlNow(String url) {
        if (LOG.isLoggable(LOG.DEBUG) && !url.startsWith("javascript:")) {
            LOG.d(TAG, ">>> loadUrlNow()");
        }
        if (url.startsWith("file://") || url.startsWith("javascript:") || Config.isUrlWhiteListed(url)) {
            super.loadUrl(url);
        }
    }

    /**
     * Load the url into the webview after waiting for period of time.
     * This is used to display the splashscreen for certain amount of time.
     *
     * @param url
     * @param time              The number of ms to wait before loading webview
     */
    public void loadUrlIntoView(final String url, final int time) {

        // If not first page of app, then load immediately
        // Add support for browser history if we use it.
        if ((url.startsWith("javascript:")) || this.canGoBack()) {
        }

        // If first page, then show splashscreen
        else {

            LOG.d(TAG, "loadUrlIntoView(%s, %d)", url, time);

            // Send message to show splashscreen now if desired
            this.postMessage("splashscreen", "show");
        }

        // Load url
        this.loadUrlIntoView(url);
    }
    
    @Override
    public void stopLoading() {
        viewClient.isCurrentlyLoading = false;
        super.stopLoading();
    }
    
    public void onScrollChanged(int l, int t, int oldl, int oldt)
    {
        super.onScrollChanged(l, t, oldl, oldt);
        //We should post a message that the scroll changed
        ScrollEvent myEvent = new ScrollEvent(l, t, oldl, oldt, this);
        this.postMessage("onScrollChanged", myEvent);
    }
    
    /**
     * Send JavaScript statement back to JavaScript.
     * (This is a convenience method)
     *
     * @param statement
     */
    public void sendJavascript(String statement) {
        this.jsMessageQueue.addJavaScript(statement);
    }

    /**
     * Send a plugin result back to JavaScript.
     * (This is a convenience method)
     *
     * @param result
     * @param callbackId
     */
    public void sendPluginResult(PluginResult result, String callbackId) {
        this.jsMessageQueue.addPluginResult(result, callbackId);
    }

    /**
     * Send a message to all plugins.
     *
     * @param id            The message id
     * @param data          The message data
     */
    public void postMessage(String id, Object data) {
        if (this.pluginManager != null) {
            this.pluginManager.postMessage(id, data);
        }
    }


    /**
     * Go to previous page in history.  (We manage our own history)
     *
     * @return true if we went back, false if we are already at top
     */
    public boolean backHistory() {

        // Check webview first to see if there is a history
        // This is needed to support curPage#diffLink, since they are added to appView's history, but not our history url array (JQMobile behavior)
        if (super.canGoBack()) {
            printBackForwardList();
            super.goBack();
            
            return true;
        }
        return false;
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
        LOG.d(TAG, "showWebPage(%s, %b, %b, HashMap", url, openExternal, clearHistory);

        // If clearing history
        if (clearHistory) {
            this.clearHistory();
        }

        // If loading into our webview
        if (!openExternal) {

            // Make sure url is in whitelist
            if (url.startsWith("file://") || Config.isUrlWhiteListed(url)) {
                // TODO: What about params?
                // Load new URL
                this.loadUrl(url);
                return;
            }
            // Load in default viewer if not
            LOG.w(TAG, "showWebPage: Cannot load URL into webview since it is not in white list.  Loading into browser instead. (URL=" + url + ")");
        }
        try {
            // Omitting the MIME type for file: URLs causes "No Activity found to handle Intent".
            // Adding the MIME type to http: URLs causes them to not be handled by the downloader.
            Intent intent = new Intent(Intent.ACTION_VIEW);
            Uri uri = Uri.parse(url);
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

    /**
     * Check configuration parameters from Config.
     * Approved list of URLs that can be loaded into Cordova
     *      <access origin="http://server regexp" subdomains="true" />
     * Log level: ERROR, WARN, INFO, DEBUG, VERBOSE (default=ERROR)
     *      <log level="DEBUG" />
     */
    private void loadConfiguration() {
 
        if ("true".equals(this.getProperty("Fullscreen", "false"))) {
            this.cordova.getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
            this.cordova.getActivity().getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }
    }

    /**
     * Get string property for activity.
     *
     * @param name
     * @param defaultValue
     * @return the String value for the named property
     */
    public String getProperty(String name, String defaultValue) {
        Bundle bundle = this.cordova.getActivity().getIntent().getExtras();
        if (bundle == null) {
            return defaultValue;
        }
        name = name.toLowerCase(Locale.getDefault());
        Object p = bundle.get(name);
        if (p == null) {
            return defaultValue;
        }
        return p.toString();
    }

    /*
     * onKeyDown
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event)
    {
        if(keyDownCodes.contains(keyCode))
        {
            if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
                    // only override default behavior is event bound
                    LOG.d(TAG, "Down Key Hit");
                    this.loadUrl("javascript:cordova.fireDocumentEvent('volumedownbutton');");
                    return true;
            }
            // If volumeup key
            else if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
                    LOG.d(TAG, "Up Key Hit");
                    this.loadUrl("javascript:cordova.fireDocumentEvent('volumeupbutton');");
                    return true;
            }
            else
            {
                return super.onKeyDown(keyCode, event);
            }
        }
        else if(keyCode == KeyEvent.KEYCODE_BACK)
        {
            return !(this.startOfHistory()) || this.bound;
        }
        else if(keyCode == KeyEvent.KEYCODE_MENU)
        {
            //How did we get here?  Is there a childView?
            View childView = this.getFocusedChild();
            if(childView != null)
            {
                //Make sure we close the keyboard if it's present
                InputMethodManager imm = (InputMethodManager) cordova.getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(childView.getWindowToken(), 0);
                cordova.getActivity().openOptionsMenu();
                return true;
            } else {
                return super.onKeyDown(keyCode, event);
            }
        }
        
        return super.onKeyDown(keyCode, event);
    }
    

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event)
    {
        // If back key
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // A custom view is currently displayed  (e.g. playing a video)
            if(mCustomView != null) {
                this.hideCustomView();
            } else {
                // The webview is currently displayed
                // If back key is bound, then send event to JavaScript
                if (this.bound) {
                    this.loadUrl("javascript:cordova.fireDocumentEvent('backbutton');");
                    return true;
                } else {
                    // If not bound
                    // Go to previous page in webview if it is possible to go back
                    if (this.backHistory()) {
                        return true;
                    }
                    // If not, then invoke default behavior
                    else {
                        //this.activityState = ACTIVITY_EXITING;
                    	//return false;
                    	// If they hit back button when app is initializing, app should exit instead of hang until initialization (CB2-458)
                    	this.cordova.getActivity().finish();
                    }
                }
            }
        }
        // Legacy
        else if (keyCode == KeyEvent.KEYCODE_MENU) {
            if (this.lastMenuEventTime < event.getEventTime()) {
                this.loadUrl("javascript:cordova.fireDocumentEvent('menubutton');");
            }
            this.lastMenuEventTime = event.getEventTime();
            return super.onKeyUp(keyCode, event);
        }
        // If search key
        else if (keyCode == KeyEvent.KEYCODE_SEARCH) {
            this.loadUrl("javascript:cordova.fireDocumentEvent('searchbutton');");
            return true;
        }
        else if(keyUpCodes.contains(keyCode))
        {
            //What the hell should this do?
            return super.onKeyUp(keyCode, event);
        }

        //Does webkit change this behavior?
        return super.onKeyUp(keyCode, event);
    }

    
    public void bindButton(boolean override)
    {
        this.bound = override;
    }

    public void bindButton(String button, boolean override) {
        // TODO Auto-generated method stub
        if (button.compareTo("volumeup")==0) {
          keyDownCodes.add(KeyEvent.KEYCODE_VOLUME_UP);
        }
        else if (button.compareTo("volumedown")==0) {
          keyDownCodes.add(KeyEvent.KEYCODE_VOLUME_DOWN);
        }
      }

    public void bindButton(int keyCode, boolean keyDown, boolean override) {
       if(keyDown)
       {
           keyDownCodes.add(keyCode);
       }
       else
       {
           keyUpCodes.add(keyCode);
       }
    }

    public boolean isBackButtonBound()
    {
        return this.bound;
    }
    
    public void handlePause(boolean keepRunning)
    {
        LOG.d(TAG, "Handle the pause");
        // Send pause event to JavaScript
        this.loadUrl("javascript:try{cordova.fireDocumentEvent('pause');}catch(e){console.log('exception firing pause event from native');};");

        // Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onPause(keepRunning);
        }

        // If app doesn't want to run in background
        if (!keepRunning) {
            // Pause JavaScript timers (including setInterval)
            this.pauseTimers();
        }
        paused = true;
   
    }
    
    public void handleResume(boolean keepRunning, boolean activityResultKeepRunning)
    {

        this.loadUrl("javascript:try{cordova.fireDocumentEvent('resume');}catch(e){console.log('exception firing resume event from native');};");
        
        // Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onResume(keepRunning);
        }

        // Resume JavaScript timers (including setInterval)
        this.resumeTimers();
        paused = false;
    }
    
    public void handleDestroy()
    {
        // Send destroy event to JavaScript
        this.loadUrl("javascript:try{cordova.require('cordova/channel').onDestroy.fire();}catch(e){console.log('exception firing destroy event from native');};");

        // Load blank page so that JavaScript onunload is called
        this.loadUrl("about:blank");

        // Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onDestroy();
        }
        
        // unregister the receiver
        if (this.receiver != null) {
            try {
                this.cordova.getActivity().unregisterReceiver(this.receiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering configuration receiver: " + e.getMessage(), e);
            }
        }
    }
    
    public void onNewIntent(Intent intent)
    {
        //Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onNewIntent(intent);
        }
    }
    
    public boolean isPaused()
    {
        return paused;
    }

    public boolean hadKeyEvent() {
        return handleButton;
    }

    // Wrapping these functions in their own class prevents warnings in adb like:
    // VFY: unable to resolve virtual method 285: Landroid/webkit/WebSettings;.setAllowUniversalAccessFromFileURLs
    @TargetApi(16)
    private static class Level16Apis {
        static void enableUniversalAccess(WebSettings settings) {
            settings.setAllowUniversalAccessFromFileURLs(true);
        }
    }
    
    public void printBackForwardList() {
        WebBackForwardList currentList = this.copyBackForwardList();
        int currentSize = currentList.getSize();
        for(int i = 0; i < currentSize; ++i)
        {
            WebHistoryItem item = currentList.getItemAtIndex(i);
            String url = item.getUrl();
            LOG.d(TAG, "The URL at index: " + Integer.toString(i) + " is " + url );
        }
    }
    
    
    //Can Go Back is BROKEN!
    public boolean startOfHistory()
    {
        WebBackForwardList currentList = this.copyBackForwardList();
        WebHistoryItem item = currentList.getItemAtIndex(0);
        if( item!=null){	// Null-fence in case they haven't called loadUrl yet (CB-2458)
	        String url = item.getUrl();
	        String currentUrl = this.getUrl();
	        LOG.d(TAG, "The current URL is: " + currentUrl);
	        LOG.d(TAG, "The URL at item 0 is: " + url);
	        return currentUrl.equals(url);
        }
        return false;
    }

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
        ViewGroup parent = (ViewGroup) this.getParent();
        parent.addView(view, COVER_SCREEN_GRAVITY_CENTER);
        
        // Hide the content view.
        this.setVisibility(View.GONE);
        
        // Finally show the custom view container.
        parent.setVisibility(View.VISIBLE);
        parent.bringToFront();
    }

    public void hideCustomView() {
        // This code is adapted from the original Android Browser code, licensed under the Apache License, Version 2.0
        Log.d(TAG, "Hiding Custom View");
        if (mCustomView == null) return;

        // Hide the custom view.
        mCustomView.setVisibility(View.GONE);
        
        // Remove the custom view from its container.
        ViewGroup parent = (ViewGroup) this.getParent();
        parent.removeView(mCustomView);
        mCustomView = null;
        mCustomViewCallback.onCustomViewHidden();
        
        // Show the content view.
        this.setVisibility(View.VISIBLE);
    }
    
    /**
     * if the video overlay is showing then we need to know 
     * as it effects back button handling
     * 
     * @return true if custom view is showing
     */
    public boolean isCustomViewShowing() {
        return mCustomView != null;
    }
    
    public WebBackForwardList restoreState(Bundle savedInstanceState)
    {
        WebBackForwardList myList = super.restoreState(savedInstanceState);
        Log.d(TAG, "WebView restoration crew now restoring!");
        //Initialize the plugin manager once more
        this.pluginManager.init();
        return myList;
    }

    public void storeResult(int requestCode, int resultCode, Intent intent) {
        mResult = new ActivityResult(requestCode, resultCode, intent);
    }
    
    public CordovaResourceApi getResourceApi() {
        return resourceApi;
    }
}
