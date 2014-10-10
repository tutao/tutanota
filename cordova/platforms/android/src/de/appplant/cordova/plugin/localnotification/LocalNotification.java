/*
    Copyright 2013-2014 appPlant UG

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

package de.appplant.cordova.plugin.localnotification;

import java.util.ArrayList;
import java.util.Map;
import java.util.Set;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

/**
 * This plugin utilizes the Android AlarmManager in combination with StatusBar
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android status bar.
 */
public class LocalNotification extends CordovaPlugin {

    protected final static String PLUGIN_NAME = "LocalNotification";

    private   static CordovaWebView webView = null;
    private   static Boolean deviceready = false;
    protected static Context context = null;
    protected static Boolean isInBackground = true;
    private   static ArrayList<String> eventQueue = new ArrayList<String>();

    @Override
    public void initialize (CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        LocalNotification.webView = super.webView;
        LocalNotification.context = super.cordova.getActivity().getApplicationContext();
    }

    @Override
    public boolean execute (String action, final JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equalsIgnoreCase("add")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    JSONObject arguments = args.optJSONObject(0);
                    Options options      = new Options(context).parse(arguments);

                    persist(options.getId(), args);
                    add(options, true);
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("cancel")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    String id = args.optString(0);

                    cancel(id);
                    unpersist(id);
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("cancelAll")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    cancelAll();
                    unpersistAll();
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("isScheduled")) {
            String id = args.optString(0);

            isScheduled(id, callbackContext);

            return true;
        }

        if (action.equalsIgnoreCase("getScheduledIds")) {
            getScheduledIds(callbackContext);

            return true;
        }

        if (action.equalsIgnoreCase("hasPermission")) {
            hasPermission(callbackContext);
            return true;
        }

        if (action.equalsIgnoreCase("promptForPermission")) {
            return true;
        }

        if (action.equalsIgnoreCase("deviceready")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    deviceready();
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("pause")) {
            isInBackground = true;

            return true;
        }

        if (action.equalsIgnoreCase("resume")) {
            isInBackground = false;

            return true;
        }

        // Returning false results in a "MethodNotFound" error.
        return false;
    }

    /**
     * Calls all pending callbacks after the deviceready event has been fired.
     */
    private static void deviceready () {
        deviceready = true;

        for (String js : eventQueue) {
            webView.sendJavascript(js);
        }

        eventQueue.clear();
    }

    /**
     * Set an alarm.
     *
     * @param options
     *            The options that can be specified per alarm.
     * @param doFireEvent
     *            If the onadd callback shall be called.
     */
    public static void add (Options options, boolean doFireEvent) {
        long triggerTime = options.getDate();

        Intent intent = new Intent(context, Receiver.class)
            .setAction("" + options.getId())
            .putExtra(Receiver.OPTIONS, options.getJSONObject().toString());

        AlarmManager am  = getAlarmManager();
        PendingIntent pi = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        if (doFireEvent) {
            fireEvent("add", options.getId(), options.getJSON());
        }

        am.set(AlarmManager.RTC_WAKEUP, triggerTime, pi);
    }

    /**
     * Cancel a specific notification that was previously registered.
     *
     * @param notificationId
     *            The original ID of the notification that was used when it was
     *            registered using add()
     */
    public static void cancel (String notificationId) {
        /*
         * Create an intent that looks similar, to the one that was registered
         * using add. Making sure the notification id in the action is the same.
         * Now we can search for such an intent using the 'getService' method
         * and cancel it.
         */
        Intent intent = new Intent(context, Receiver.class)
            .setAction("" + notificationId);

        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager am        = getAlarmManager();
        NotificationManager nc = getNotificationManager();

        am.cancel(pi);

        try {
            nc.cancel(Integer.parseInt(notificationId));
        } catch (Exception e) {}

        fireEvent("cancel", notificationId, "");
    }

    /**
     * Cancel all notifications that were created by this plugin.
     *
     * Android can only unregister a specific alarm. There is no such thing
     * as cancelAll. Therefore we rely on the Shared Preferences which holds
     * all our alarms to loop through these alarms and unregister them one
     * by one.
     */
    public static void cancelAll() {
        SharedPreferences settings = getSharedPreferences();
        NotificationManager nc     = getNotificationManager();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();

        for (String alarmId : alarmIds) {
            cancel(alarmId);
        }

        nc.cancelAll();
    }

    /**
     * Checks wether a notification with an ID is scheduled.
     *
     * @param id
     *          The notification ID to be check.
     * @param callbackContext
     */
    public static void isScheduled (String id, CallbackContext callbackContext) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        boolean isScheduled        = alarms.containsKey(id);
        PluginResult result        = new PluginResult(PluginResult.Status.OK, isScheduled);

        callbackContext.sendPluginResult(result);
    }

    /**
     * Retrieves a list with all currently pending notifications.
     *
     * @param callbackContext
     */
    public static void getScheduledIds (CallbackContext callbackContext) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray pendingIds       = new JSONArray(alarmIds);

        callbackContext.success(pendingIds);
    }

    /**
     * Informs if the app has the permission to show notifications.
     *
     * @param callback
     *      The function to be exec as the callback
     */
    private void hasPermission (final CallbackContext callback) {
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                PluginResult result;

                result = new PluginResult(PluginResult.Status.OK, true);

                callback.sendPluginResult(result);
            }
        });
    }

    /**
     * Persist the information of this alarm to the Android Shared Preferences.
     * This will allow the application to restore the alarm upon device reboot.
     * Also this is used by the cancelAll method.
     *
     * @param alarmId
     *            The Id of the notification that must be persisted.
     * @param args
     *            The assumption is that parse has been called already.
     */
    public static void persist (String alarmId, JSONArray args) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.putString(alarmId, args.toString());
            editor.apply();
        }
    }

    /**
     * Remove a specific alarm from the Android shared Preferences.
     *
     * @param alarmId
     *            The Id of the notification that must be removed.
     */
    public static void unpersist (String alarmId) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.remove(alarmId);
            editor.apply();
        }
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    public static void unpersistAll () {
        Editor editor = getSharedPreferences().edit();

        editor.clear();
        editor.apply();
    }

    /**
     * Fires the given event.
     *
     * @param {String} event The Name of the event
     * @param {String} id    The ID of the notification
     * @param {String} json  A custom (JSON) string
     */
    public static void fireEvent (String event, String id, String json) {
        String state  = getApplicationState();
        String params = "\"" + id + "\",\"" + state + "\",\\'" + JSONObject.quote(json) + "\\'.replace(/(^\"|\"$)/g, \\'\\')";
        String js     = "setTimeout('plugin.notification.local.on" + event + "(" + params + ")',0)";

        // webview may available, but callbacks needs to be executed
        // after deviceready
        if (deviceready == false) {
            eventQueue.add(js);
        } else {
            webView.sendJavascript(js);
        }
    }

    /**
     * Retrieves the application state
     *
     * @return {String}
     *      Either "background" or "foreground"
     */
    protected static String getApplicationState () {
        return isInBackground ? "background" : "foreground";
    }

    /**
     * Set the application context if not already set.
     */
    protected static void setContext (Context context) {
        if (LocalNotification.context == null) {
            LocalNotification.context = context;
        }
    }

    /**
     * The Local storage for the application.
     */
    protected static SharedPreferences getSharedPreferences () {
        return context.getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE);
    }

    /**
     * The alarm manager for the application.
     */
    protected static AlarmManager getAlarmManager () {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    /**
     * The notification manager for the application.
     */
    protected static NotificationManager getNotificationManager () {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }
}