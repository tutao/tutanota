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

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginEntry;
import org.apache.cordova.PluginResult;
import org.json.JSONException;
import org.xmlpull.v1.XmlPullParserException;

import android.content.Intent;
import android.content.res.XmlResourceParser;

import android.net.Uri;
import android.os.Debug;
import android.util.Log;

/**
 * PluginManager is exposed to JavaScript in the Cordova WebView.
 *
 * Calling native plugin code can be done by calling PluginManager.exec(...)
 * from JavaScript.
 */
public class PluginManager {
    private static String TAG = "PluginManager";
    private static final int SLOW_EXEC_WARNING_THRESHOLD = Debug.isDebuggerConnected() ? 60 : 16;

    // List of service entries
    private final HashMap<String, PluginEntry> entries = new HashMap<String, PluginEntry>();

    private final CordovaInterface ctx;
    private final CordovaWebView app;

    // Flag to track first time through
    private boolean firstRun;

    // Stores mapping of Plugin Name -> <url-filter> values.
    // Using <url-filter> is deprecated.
    protected HashMap<String, List<String>> urlMap = new HashMap<String, List<String>>();

    private AtomicInteger numPendingUiExecs;

    /**
     * Constructor.
     *
     * @param app
     * @param ctx
     */
    public PluginManager(CordovaWebView app, CordovaInterface ctx) {
        this.ctx = ctx;
        this.app = app;
        this.firstRun = true;
        this.numPendingUiExecs = new AtomicInteger(0);
    }

    /**
     * Init when loading a new HTML page into webview.
     */
    public void init() {
        LOG.d(TAG, "init()");

        // If first time, then load plugins from config.xml file
        if (this.firstRun) {
            this.loadPlugins();
            this.firstRun = false;
        }

        // Stop plugins on current HTML page and discard plugin objects
        else {
            this.onPause(false);
            this.onDestroy();
            this.clearPluginObjects();
        }

        // Insert PluginManager service
        this.addService(new PluginEntry("PluginManager", new PluginManagerService()));

        // Start up all plugins that have onload specified
        this.startupPlugins();
    }

    /**
     * Load plugins from res/xml/config.xml
     */
    public void loadPlugins() {
        // First checking the class namespace for config.xml
        int id = this.ctx.getActivity().getResources().getIdentifier("config", "xml", this.ctx.getActivity().getClass().getPackage().getName());
        if (id == 0) {
            // If we couldn't find config.xml there, we'll look in the namespace from AndroidManifest.xml
            id = this.ctx.getActivity().getResources().getIdentifier("config", "xml", this.ctx.getActivity().getPackageName());
            if (id == 0) {
                this.pluginConfigurationMissing();
                //We have the error, we need to exit without crashing!
                return;
            }
        }
        XmlResourceParser xml = this.ctx.getActivity().getResources().getXml(id);
        int eventType = -1;
        String service = "", pluginClass = "", paramType = "";
        boolean onload = false;
        boolean insideFeature = false;
        while (eventType != XmlResourceParser.END_DOCUMENT) {
            if (eventType == XmlResourceParser.START_TAG) {
                String strNode = xml.getName();
                if (strNode.equals("url-filter")) {
                    Log.w(TAG, "Plugin " + service + " is using deprecated tag <url-filter>");
                    if (urlMap.get(service) == null) {
                        urlMap.put(service, new ArrayList<String>(2));
                    }
                    List<String> filters = urlMap.get(service);
                    filters.add(xml.getAttributeValue(null, "value"));
                }
                else if (strNode.equals("feature")) {
                    //Check for supported feature sets  aka. plugins (Accelerometer, Geolocation, etc)
                    //Set the bit for reading params
                    insideFeature = true;
                    service = xml.getAttributeValue(null, "name");
                }
                else if (insideFeature && strNode.equals("param")) {
                    paramType = xml.getAttributeValue(null, "name");
                    if (paramType.equals("service")) // check if it is using the older service param
                        service = xml.getAttributeValue(null, "value");
                    else if (paramType.equals("package") || paramType.equals("android-package"))
                        pluginClass = xml.getAttributeValue(null,"value");
                    else if (paramType.equals("onload"))
                        onload = "true".equals(xml.getAttributeValue(null, "value"));
                }
            }
            else if (eventType == XmlResourceParser.END_TAG)
            {
                String strNode = xml.getName();
                if (strNode.equals("feature") || strNode.equals("plugin"))
                {
                    PluginEntry entry = new PluginEntry(service, pluginClass, onload);
                    this.addService(entry);

                    //Empty the strings to prevent plugin loading bugs
                    service = "";
                    pluginClass = "";
                    insideFeature = false;
                }
            }
            try {
                eventType = xml.next();
            } catch (XmlPullParserException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Delete all plugin objects.
     */
    public void clearPluginObjects() {
        for (PluginEntry entry : this.entries.values()) {
            entry.plugin = null;
        }
    }

    /**
     * Create plugins objects that have onload set.
     */
    public void startupPlugins() {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.onload) {
                entry.createPlugin(this.app, this.ctx);
            }
        }
    }

    /**
     * Receives a request for execution and fulfills it by finding the appropriate
     * Java class and calling it's execute method.
     *
     * PluginManager.exec can be used either synchronously or async. In either case, a JSON encoded
     * string is returned that will indicate if any errors have occurred when trying to find
     * or execute the class denoted by the clazz argument.
     *
     * @param service       String containing the service to run
     * @param action        String containing the action that the class is supposed to perform. This is
     *                      passed to the plugin execute method and it is up to the plugin developer
     *                      how to deal with it.
     * @param callbackId    String containing the id of the callback that is execute in JavaScript if
     *                      this is an async plugin call.
     * @param rawArgs       An Array literal string containing any arguments needed in the
     *                      plugin execute method.
     */
    public void exec(final String service, final String action, final String callbackId, final String rawArgs) {
        if (numPendingUiExecs.get() > 0) {
            numPendingUiExecs.getAndIncrement();
            this.ctx.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    execHelper(service, action, callbackId, rawArgs);
                    numPendingUiExecs.getAndDecrement();
                }
            });
        } else {
            execHelper(service, action, callbackId, rawArgs);
        }
    }

    private void execHelper(final String service, final String action, final String callbackId, final String rawArgs) {
        CordovaPlugin plugin = getPlugin(service);
        if (plugin == null) {
            Log.d(TAG, "exec() call to unknown plugin: " + service);
            PluginResult cr = new PluginResult(PluginResult.Status.CLASS_NOT_FOUND_EXCEPTION);
            app.sendPluginResult(cr, callbackId);
            return;
        }
        CallbackContext callbackContext = new CallbackContext(callbackId, app);
        try {
            long pluginStartTime = System.currentTimeMillis();
            boolean wasValidAction = plugin.execute(action, rawArgs, callbackContext);
            long duration = System.currentTimeMillis() - pluginStartTime;

            if (duration > SLOW_EXEC_WARNING_THRESHOLD) {
                Log.w(TAG, "THREAD WARNING: exec() call to " + service + "." + action + " blocked the main thread for " + duration + "ms. Plugin should use CordovaInterface.getThreadPool().");
            }
            if (!wasValidAction) {
                PluginResult cr = new PluginResult(PluginResult.Status.INVALID_ACTION);
                callbackContext.sendPluginResult(cr);
            }
        } catch (JSONException e) {
            PluginResult cr = new PluginResult(PluginResult.Status.JSON_EXCEPTION);
            callbackContext.sendPluginResult(cr);
        } catch (Exception e) {
            Log.e(TAG, "Uncaught exception from plugin", e);
            callbackContext.error(e.getMessage());
        }
    }

    @Deprecated
    public void exec(String service, String action, String callbackId, String jsonArgs, boolean async) {
        exec(service, action, callbackId, jsonArgs);
    }

    /**
     * Get the plugin object that implements the service.
     * If the plugin object does not already exist, then create it.
     * If the service doesn't exist, then return null.
     *
     * @param service       The name of the service.
     * @return              CordovaPlugin or null
     */
    public CordovaPlugin getPlugin(String service) {
        PluginEntry entry = this.entries.get(service);
        if (entry == null) {
            return null;
        }
        CordovaPlugin plugin = entry.plugin;
        if (plugin == null) {
            plugin = entry.createPlugin(this.app, this.ctx);
        }
        return plugin;
    }

    /**
     * Add a plugin class that implements a service to the service entry table.
     * This does not create the plugin object instance.
     *
     * @param service           The service name
     * @param className         The plugin class name
     */
    public void addService(String service, String className) {
        PluginEntry entry = new PluginEntry(service, className, false);
        this.addService(entry);
    }

    /**
     * Add a plugin class that implements a service to the service entry table.
     * This does not create the plugin object instance.
     *
     * @param entry             The plugin entry
     */
    public void addService(PluginEntry entry) {
        this.entries.put(entry.service, entry);
    }

    /**
     * Called when the system is about to start resuming a previous activity.
     *
     * @param multitasking      Flag indicating if multitasking is turned on for app
     */
    public void onPause(boolean multitasking) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onPause(multitasking);
            }
        }
    }

    /**
     * Called when the activity will start interacting with the user.
     *
     * @param multitasking      Flag indicating if multitasking is turned on for app
     */
    public void onResume(boolean multitasking) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onResume(multitasking);
            }
        }
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onDestroy();
            }
        }
    }

    /**
     * Send a message to all plugins.
     *
     * @param id                The message id
     * @param data              The message data
     * @return                  Object to stop propagation or null
     */
    public Object postMessage(String id, Object data) {
        Object obj = this.ctx.onMessage(id, data);
        if (obj != null) {
            return obj;
        }
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                obj = entry.plugin.onMessage(id, data);
                if (obj != null) {
                    return obj;
                }
            }
        }
        return null;
    }

    /**
     * Called when the activity receives a new intent.
     */
    public void onNewIntent(Intent intent) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                entry.plugin.onNewIntent(intent);
            }
        }
    }

    /**
     * Called when the URL of the webview changes.
     *
     * @param url               The URL that is being changed to.
     * @return                  Return false to allow the URL to load, return true to prevent the URL from loading.
     */
    public boolean onOverrideUrlLoading(String url) {
        // Deprecated way to intercept URLs. (process <url-filter> tags).
        // Instead, plugins should not include <url-filter> and instead ensure
        // that they are loaded before this function is called (either by setting
        // the onload <param> or by making an exec() call to them)
        for (PluginEntry entry : this.entries.values()) {
            List<String> urlFilters = urlMap.get(entry.service);
            if (urlFilters != null) {
                for (String s : urlFilters) {
                    if (url.startsWith(s)) {
                        return getPlugin(entry.service).onOverrideUrlLoading(url);
                    }
                }
            } else if (entry.plugin != null) {
                if (entry.plugin.onOverrideUrlLoading(url)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Called when the app navigates or refreshes.
     */
    public void onReset() {
        Iterator<PluginEntry> it = this.entries.values().iterator();
        while (it.hasNext()) {
            CordovaPlugin plugin = it.next().plugin;
            if (plugin != null) {
                plugin.onReset();
            }
        }
    }


    private void pluginConfigurationMissing() {
        LOG.e(TAG, "=====================================================================================");
        LOG.e(TAG, "ERROR: config.xml is missing.  Add res/xml/config.xml to your project.");
        LOG.e(TAG, "https://git-wip-us.apache.org/repos/asf?p=cordova-android.git;a=blob;f=framework/res/xml/config.xml");
        LOG.e(TAG, "=====================================================================================");
    }

    Uri remapUri(Uri uri) {
        for (PluginEntry entry : this.entries.values()) {
            if (entry.plugin != null) {
                Uri ret = entry.plugin.remapUri(uri);
                if (ret != null) {
                    return ret;
                }
            }
        }
        return null;
    }

    private class PluginManagerService extends CordovaPlugin {
        @Override
        public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
            if ("startup".equals(action)) {
                // The onPageStarted event of CordovaWebViewClient resets the queue of messages to be returned to javascript in response
                // to exec calls. Since this event occurs on the UI thread and exec calls happen on the WebCore thread it is possible
                // that onPageStarted occurs after exec calls have started happening on a new page, which can cause the message queue
                // to be reset between the queuing of a new message and its retrieval by javascript. To avoid this from happening,
                // javascript always sends a "startup" exec upon loading a new page which causes all future exec calls to happen on the UI
                // thread (and hence after onPageStarted) until there are no more pending exec calls remaining.
                numPendingUiExecs.getAndIncrement();
                ctx.getActivity().runOnUiThread(new Runnable() {
                    public void run() {
                        numPendingUiExecs.getAndDecrement();
                    }
                });
                return true;
            }
            return false;
        }
    }
}
