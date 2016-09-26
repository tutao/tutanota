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

import java.security.SecureRandom;

import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;

/**
 * Contains APIs that the JS can call. All functions in here should also have
 * an equivalent entry in CordovaChromeClient.java, and be added to
 * cordova-js/lib/android/plugin/android/promptbasednativeapi.js
 */
public class CordovaBridge {
    private static final String LOG_TAG = "CordovaBridge";
    private PluginManager pluginManager;
    private NativeToJsMessageQueue jsMessageQueue;
    private volatile int expectedBridgeSecret = -1; // written by UI thread, read by JS thread.

    public CordovaBridge(PluginManager pluginManager, NativeToJsMessageQueue jsMessageQueue) {
        this.pluginManager = pluginManager;
        this.jsMessageQueue = jsMessageQueue;
    }

    public String jsExec(int bridgeSecret, String service, String action, String callbackId, String arguments) throws JSONException, IllegalAccessException {
        if (!verifySecret("exec()", bridgeSecret)) {
            return null;
        }
        // If the arguments weren't received, send a message back to JS.  It will switch bridge modes and try again.  See CB-2666.
        // We send a message meant specifically for this case.  It starts with "@" so no other message can be encoded into the same string.
        if (arguments == null) {
            return "@Null arguments.";
        }

        jsMessageQueue.setPaused(true);
        try {
            // Tell the resourceApi what thread the JS is running on.
            CordovaResourceApi.jsThread = Thread.currentThread();

            pluginManager.exec(service, action, callbackId, arguments);
            String ret = null;
            if (!NativeToJsMessageQueue.DISABLE_EXEC_CHAINING) {
                ret = jsMessageQueue.popAndEncode(false);
            }
            return ret;
        } catch (Throwable e) {
            e.printStackTrace();
            return "";
        } finally {
            jsMessageQueue.setPaused(false);
        }
    }

    public void jsSetNativeToJsBridgeMode(int bridgeSecret, int value) throws IllegalAccessException {
        if (!verifySecret("setNativeToJsBridgeMode()", bridgeSecret)) {
            return;
        }
        jsMessageQueue.setBridgeMode(value);
    }

    public String jsRetrieveJsMessages(int bridgeSecret, boolean fromOnlineEvent) throws IllegalAccessException {
        if (!verifySecret("retrieveJsMessages()", bridgeSecret)) {
            return null;
        }
        return jsMessageQueue.popAndEncode(fromOnlineEvent);
    }

    private boolean verifySecret(String action, int bridgeSecret) throws IllegalAccessException {
        if (!jsMessageQueue.isBridgeEnabled()) {
            if (bridgeSecret == -1) {
                Log.d(LOG_TAG, action + " call made before bridge was enabled.");
            } else {
                Log.d(LOG_TAG, "Ignoring " + action + " from previous page load.");
            }
            return false;
        }
        // Bridge secret wrong and bridge not due to it being from the previous page.
        if (expectedBridgeSecret < 0 || bridgeSecret != expectedBridgeSecret) {
            Log.e(LOG_TAG, "Bridge access attempt with wrong secret token, possibly from malicious code. Disabling exec() bridge!");
            clearBridgeSecret();
            throw new IllegalAccessException();
        }
        return true;
    }

    /** Called on page transitions */
    void clearBridgeSecret() {
        expectedBridgeSecret = -1;
    }

    public boolean isSecretEstablished() {
        return expectedBridgeSecret != -1;
    }

    /** Called by cordova.js to initialize the bridge. */
    int generateBridgeSecret() {
        SecureRandom randGen = new SecureRandom();
        expectedBridgeSecret = randGen.nextInt(Integer.MAX_VALUE);
        return expectedBridgeSecret;
    }

    public void reset() {
        jsMessageQueue.reset();
        clearBridgeSecret();        
    }

    public String promptOnJsPrompt(String origin, String message, String defaultValue) {
        if (defaultValue != null && defaultValue.length() > 3 && defaultValue.startsWith("gap:")) {
            JSONArray array;
            try {
                array = new JSONArray(defaultValue.substring(4));
                int bridgeSecret = array.getInt(0);
                String service = array.getString(1);
                String action = array.getString(2);
                String callbackId = array.getString(3);
                String r = jsExec(bridgeSecret, service, action, callbackId, message);
                return r == null ? "" : r;
            } catch (JSONException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
            return "";
        }
        // Sets the native->JS bridge mode. 
        else if (defaultValue != null && defaultValue.startsWith("gap_bridge_mode:")) {
            try {
                int bridgeSecret = Integer.parseInt(defaultValue.substring(16));
                jsSetNativeToJsBridgeMode(bridgeSecret, Integer.parseInt(message));
            } catch (NumberFormatException e){
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
            return "";
        }
        // Polling for JavaScript messages 
        else if (defaultValue != null && defaultValue.startsWith("gap_poll:")) {
            int bridgeSecret = Integer.parseInt(defaultValue.substring(9));
            try {
                String r = jsRetrieveJsMessages(bridgeSecret, "1".equals(message));
                return r == null ? "" : r;
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
            return "";
        }
        else if (defaultValue != null && defaultValue.startsWith("gap_init:")) {
            // Protect against random iframes being able to talk through the bridge.
            // Trust only pages which the app would have been allowed to navigate to anyway.
            if (pluginManager.shouldAllowBridgeAccess(origin)) {
                // Enable the bridge
                int bridgeMode = Integer.parseInt(defaultValue.substring(9));
                jsMessageQueue.setBridgeMode(bridgeMode);
                // Tell JS the bridge secret.
                int secret = generateBridgeSecret();
                return ""+secret;
            } else {
                Log.e(LOG_TAG, "gap_init called from restricted origin: " + origin);
            }
            return "";
        }
        return null;
    }
}
