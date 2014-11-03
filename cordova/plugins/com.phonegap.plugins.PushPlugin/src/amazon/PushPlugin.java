/* 
 * Copyright 2014 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License. 
 */

package com.amazon.cordova.plugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaActivity;
import org.apache.cordova.LOG;
import org.json.JSONArray;
import org.json.JSONException;
import com.amazon.device.messaging.ADM;
import android.app.Activity;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

import java.util.Iterator;

import org.json.JSONObject;

public class PushPlugin extends CordovaPlugin {

    private static String TAG = "PushPlugin";
    /**
     * @uml.property name="adm"
     * @uml.associationEnd
     */
    private ADM adm = null;
    /**
     * @uml.property name="activity"
     * @uml.associationEnd
     */
    private Activity activity = null;
    private static CordovaWebView webview = null;
    private static String notificationHandlerCallBack;
    private static boolean isForeground = false;
    private static Bundle gCachedExtras = null;
   
    
    public static final String REGISTER = "register";
    public static final String UNREGISTER = "unregister";
    public static final String REGISTER_EVENT = "registered";
    public static final String UNREGISTER_EVENT = "unregistered";
    public static final String MESSAGE = "message";
    public static final String ECB = "ecb";
    public static final String EVENT = "event";
    public static final String PAYLOAD = "payload";
    public static final String FOREGROUND = "foreground";
    public static final String REG_ID = "regid";
    public static final String COLDSTART = "coldstart";

    private static final String NON_AMAZON_DEVICE_ERROR = "PushNotifications using Amazon Device Messaging is only supported on Kindle Fire devices (2nd Generation and Later only).";
    private static final String ADM_NOT_SUPPORTED_ERROR = "Amazon Device Messaging is not supported on this device.";
    private static final String REGISTER_OPTIONS_NULL = "Register options are not specified.";
    private static final String ECB_NOT_SPECIFIED = "ecb(eventcallback) option is not specified in register().";
    private static final String ECB_NAME_NOT_SPECIFIED = "ecb(eventcallback) value is missing in options for register().";
    private static final String REGISTRATION_SUCCESS_RESPONSE = "Registration started...";
    private static final String UNREGISTRATION_SUCCESS_RESPONSE = "Unregistration started...";
    
    private static final String MODEL_FIRST_GEN = "Kindle Fire";

    public enum ADMReadiness {
        INITIALIZED, NON_AMAZON_DEVICE, ADM_NOT_SUPPORTED
    }

    /**
     * Sets the context of the Command. This can then be used to do things like get file paths associated with the
     * Activity.
     * 
     * @param cordova
     *            The context of the main Activity.
     * @param webView
     *            The associated CordovaWebView.
     */
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        // Initialize only for Amazon devices 2nd Generation and later
        if (this.isAmazonDevice() && !isFirstGenKindleFireDevice()) {
            adm = new ADM(cordova.getActivity());
            activity = (CordovaActivity) cordova.getActivity();
            webview = this.webView;
            isForeground = true;
            ADMMessageHandler.saveConfigOptions(activity);
        } else {
            LOG.e(TAG, NON_AMAZON_DEVICE_ERROR);
        }
    }

    /**
     * Checks if current device manufacturer is Amazon by using android.os.Build.MANUFACTURER property
     * 
     * @return returns true for all Kindle Fire OS devices.
     */
    private boolean isAmazonDevice() {
        String deviceMaker = android.os.Build.MANUFACTURER;
        return deviceMaker.equalsIgnoreCase("Amazon");
    }
    
    /** 
     * Check if device is First generation Kindle
     * 
     * @return if device is First generation Kindle
     */
    private static boolean isFirstGenKindleFireDevice() {
        return android.os.Build.MODEL.equals(MODEL_FIRST_GEN);
    }
    /**
     * Checks if ADM is available and supported - could be one of three 1. Non Amazon device, hence no ADM support 2.
     * ADM is not supported on this Kindle device (1st generation) 3. ADM is successfully initialized and ready to be
     * used
     * 
     * @return returns true for all Kindle Fire OS devices.
     */
    public ADMReadiness isPushPluginReady() {
        if (adm == null) {
            return ADMReadiness.NON_AMAZON_DEVICE;
        } else if (!adm.isSupported()) {
            return ADMReadiness.ADM_NOT_SUPPORTED;
        }
        return ADMReadiness.INITIALIZED;
    }

    /**
     * @see Plugin#execute(String, JSONArray, String)
     */
    @Override
    public boolean execute(final String request, final JSONArray args,
        CallbackContext callbackContext) throws JSONException {
        try {
            // check ADM readiness
            ADMReadiness ready = isPushPluginReady();
            if (ready == ADMReadiness.NON_AMAZON_DEVICE) {
                callbackContext.error(NON_AMAZON_DEVICE_ERROR);
                return false;
            } else if (ready == ADMReadiness.ADM_NOT_SUPPORTED) {
                callbackContext.error(ADM_NOT_SUPPORTED_ERROR);
                return false;
            } else if (callbackContext == null) {
                LOG.e(TAG,
                    "CallbackConext is null. Notification to WebView is not possible. Can not proceed.");
                return false;
            }

            // Process the request here
            if (REGISTER.equals(request)) {

                if (args == null) {
                    LOG.e(TAG, REGISTER_OPTIONS_NULL);
                    callbackContext.error(REGISTER_OPTIONS_NULL);
                    return false;
                }

                // parse args to get eventcallback name
                if (args.isNull(0)) {
                    LOG.e(TAG, ECB_NOT_SPECIFIED);
                    callbackContext.error(ECB_NOT_SPECIFIED);
                    return false;
                }

                JSONObject jo = args.getJSONObject(0);
                if (jo.getString("ecb").isEmpty()) {
                    LOG.e(TAG, ECB_NAME_NOT_SPECIFIED);
                    callbackContext.error(ECB_NAME_NOT_SPECIFIED);
                    return false;
                }
                callbackContext.success(REGISTRATION_SUCCESS_RESPONSE);
                notificationHandlerCallBack = jo.getString(ECB);
                String regId = adm.getRegistrationId();
                LOG.d(TAG, "regId = " + regId);
                if (regId == null) {
                    adm.startRegister();
                } else {
                    sendRegistrationIdWithEvent(REGISTER_EVENT, regId);
                }

                // see if there are any messages while app was in background and
                // launched via app icon
                LOG.d(TAG,"checking for offline message..");
                deliverPendingMessageAndCancelNotifiation();
                return true;

            } else if (UNREGISTER.equals(request)) {
                adm.startUnregister();
                callbackContext.success(UNREGISTRATION_SUCCESS_RESPONSE);
                return true;
            } else {                
                LOG.e(TAG, "Invalid action : " + request);
                callbackContext.error("Invalid action : " + request);
                return false;
            }
        } catch (final Exception e) {
            callbackContext.error(e.getMessage());
        }

        return false;
    }

    /**
     * Checks if any bundle extras were cached while app was not running
     * 
     * @return returns tru if cached Bundle is not null otherwise true.
     */
    public boolean cachedExtrasAvailable() {
        return (gCachedExtras != null);
    }

    /**
     * Checks if offline message was pending to be delivered from notificationIntent. Sends it to webView(JS) if it is
     * and also clears notification from the NotificaitonCenter.
     */
    private boolean deliverOfflineMessages() {
        LOG.d(TAG,"deliverOfflineMessages()");
        Bundle pushBundle = ADMMessageHandler.getOfflineMessage();
        if (pushBundle != null) {
            LOG.d(TAG,"Sending offline message...");
            sendExtras(pushBundle);
            ADMMessageHandler.cleanupNotificationIntent();
            return true;
        }
        return false;
    }

    // lifecyle callback to set the isForeground
    @Override
    public void onPause(boolean multitasking) {
        LOG.d(TAG, "onPause");
        super.onPause(multitasking);
        isForeground = false;
    }

    @Override
    public void onResume(boolean multitasking) {
        LOG.d(TAG, "onResume");
        super.onResume(multitasking);
        isForeground = true;
        //Check if there are any offline messages?
        deliverPendingMessageAndCancelNotifiation();
    }

    @Override
    public void onDestroy() {
        LOG.d(TAG, "onDestroy");
        super.onDestroy();
        isForeground = false;
        webview = null;
        notificationHandlerCallBack = null;
    }

    /**
     * Indicates if app is in foreground or not.
     * 
     * @return returns true if app is running otherwise false.
     */
    public static boolean isInForeground() {
        return isForeground;
    }

    /**
     * Indicates if app is killed or not
     * 
     * @return returns true if app is killed otherwise false.
     */
    public static boolean isActive() {
        return webview != null;
    }

    /**
     * Delivers pending/offline messages if any
     * 
     * @return returns true if there were any pending messages otherwise false.
     */
    public boolean deliverPendingMessageAndCancelNotifiation() {
        boolean delivered = false;
        LOG.d(TAG,"deliverPendingMessages()");
        if (cachedExtrasAvailable()) {
            LOG.v(TAG, "sending cached extras");
            sendExtras(gCachedExtras);
            gCachedExtras = null;
            delivered = true;
        } else {
            delivered = deliverOfflineMessages();
        }
        // Clear the notification if any exists
        ADMMessageHandler.cancelNotification(activity);
        
        return delivered;
    }
    /**
     * Sends register/unregiste events to JS
     * 
     * @param String
     *            - eventName - "register", "unregister"
     * @param String
     *            - valid registrationId
     */
    public static void sendRegistrationIdWithEvent(String event,
        String registrationId) {
        if (TextUtils.isEmpty(event) || TextUtils.isEmpty(registrationId)) {
            return;
        }
        try {
            JSONObject json;
            json = new JSONObject().put(EVENT, event);
            json.put(REG_ID, registrationId);

            sendJavascript(json);
        } catch (Exception e) {
            Log.getStackTraceString(e);
        }
    }

    /**
     * Sends events to JS using cordova nativeToJS bridge.
     * 
     * @param JSONObject
     */
    public static boolean sendJavascript(JSONObject json) {
        if (json == null) {
            LOG.i(TAG, "JSON object is empty. Nothing to send to JS.");
            return true;
        }

        if (notificationHandlerCallBack != null && webview != null) {
            String jsToSend = "javascript:" + notificationHandlerCallBack + "("
                + json.toString() + ")";
            LOG.v(TAG, "sendJavascript: " + jsToSend);
            webview.sendJavascript(jsToSend);
            return true;
        }
        return false;
    }

    /*
     * Sends the pushbundle extras to the client application. If the client application isn't currently active, it is
     * cached for later processing.
     */
    public static void sendExtras(Bundle extras) {
        if (extras != null) {
            if (!sendJavascript(convertBundleToJson(extras))) {
                LOG.v(TAG,
                    "sendExtras: could not send to JS. Caching extras to send at a later time.");
                gCachedExtras = extras;
            }
        }
    }

    // serializes a bundle to JSON.
    private static JSONObject convertBundleToJson(Bundle extras) {
        if (extras == null) {
            return null;
        }

        try {
            JSONObject json;
            json = new JSONObject().put(EVENT, MESSAGE);

            JSONObject jsondata = new JSONObject();
            Iterator<String> it = extras.keySet().iterator();
            while (it.hasNext()) {
                String key = it.next();
                Object value = extras.get(key);

                // System data from Android
                if (key.equals(FOREGROUND)) {
                    json.put(key, extras.getBoolean(FOREGROUND));
                } else if (key.equals(COLDSTART)) {
                    json.put(key, extras.getBoolean(COLDSTART));
                } else {
                    // we encourage put the message content into message value
                    // when server send out notification
                    if (key.equals(MESSAGE)) {
                        json.put(key, value);
                    }

                    if (value instanceof String) {
                        // Try to figure out if the value is another JSON object

                        String strValue = (String) value;
                        if (strValue.startsWith("{")) {
                            try {
                                JSONObject json2 = new JSONObject(strValue);
                                jsondata.put(key, json2);
                            } catch (Exception e) {
                                jsondata.put(key, value);
                            }
                            // Try to figure out if the value is another JSON
                            // array
                        } else if (strValue.startsWith("[")) {
                            try {
                                JSONArray json2 = new JSONArray(strValue);
                                jsondata.put(key, json2);
                            } catch (Exception e) {
                                jsondata.put(key, value);
                            }
                        } else {
                            jsondata.put(key, value);
                        }
                    }
                } // while
            }
            json.put(PAYLOAD, jsondata);
            LOG.v(TAG, "extrasToJSON: " + json.toString());

            return json;
        } catch (JSONException e) {
            LOG.e(TAG, "extrasToJSON: JSON exception");
        }
        return null;
    }

}

