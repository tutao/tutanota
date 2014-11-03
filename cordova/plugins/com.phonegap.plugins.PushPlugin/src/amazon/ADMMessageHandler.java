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

import org.apache.cordova.CordovaActivity;
import org.json.JSONObject;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.Html;
import android.text.TextUtils;
import android.util.Log;
import android.app.Notification.Builder;

import com.amazon.device.messaging.ADMMessageHandlerBase;
import com.amazon.device.messaging.ADMMessageReceiver;

/**
 * The ADMMessageHandler class receives messages sent by ADM via the receiver.
 */

public class ADMMessageHandler extends ADMMessageHandlerBase {

    private static final String ERROR_EVENT = "error";
    public static final String PUSH_BUNDLE = "pushBundle";
    public static final String ERROR_MSG = "msg";
    private static final String SHOW_MESSAGE_PREF = "showmessageinnotification";
    private static final String DEFAULT_MESSAGE_PREF = "defaultnotificationmessage";
    private static boolean shouldShowOfflineMessage = false;
    private static String defaultOfflineMessage = null;
    private static final String PREFS_NAME = "PushPluginPrefs";
    private static final String DEFAULT_MESSAGE_TEXT = "You have a new message.";
    
    // An identifier for ADM notification unique within your application
    // It allows you to update the same notification later on
    public static final int NOTIFICATION_ID = 519;
    static Intent notificationIntent = null;

    /**
     * Class constructor.
     */
    public ADMMessageHandler() {
        super(ADMMessageHandler.class.getName());
    }

    /**
     * Class constructor, including the className argument.
     * 
     * @param className
     *            The name of the class.
     */
    public ADMMessageHandler(final String className) {
        super(className);
    }

    /**
     * The Receiver class listens for messages from ADM and forwards them to the ADMMessageHandler class.
     */
    public static class Receiver extends ADMMessageReceiver {
        public Receiver() {
            super(ADMMessageHandler.class);

        }

        // Nothing else is required here; your broadcast receiver automatically
        // forwards intents to your service for processing.
    }

    /** {@inheritDoc} */
    @Override
    protected void onRegistered(final String newRegistrationId) {
        // You start the registration process by calling startRegister() in your Main Activity. 
        // When the registration ID is ready, ADM calls onRegistered()
        // on your app. Transmit the passed-in registration ID to your server, so
        // your server can send messages to this app instance. onRegistered() is also
        // called if your registration ID is rotated or changed for any reason;
        // your app should pass the new registration ID to your server if this occurs.

        // we fire the register event in the web app, register handler should
        // fire to send the registration ID to your server via a header key/value pair over HTTP.(AJAX)
        PushPlugin.sendRegistrationIdWithEvent(PushPlugin.REGISTER_EVENT,
            newRegistrationId);
    }

    /** {@inheritDoc} */
    @Override
    protected void onUnregistered(final String registrationId) {
        // If your app is unregistered on this device, inform your server that
        // this app instance is no longer a valid target for messages.
        PushPlugin.sendRegistrationIdWithEvent(PushPlugin.UNREGISTER_EVENT,
            registrationId);
    }

    /** {@inheritDoc} */
    @Override
    protected void onRegistrationError(final String errorId) {
        // You should consider a registration error fatal. In response, your app
        // may degrade gracefully, or you may wish to notify the user that this part
        // of your app's functionality is not available.
        try {
            JSONObject json;
            json = new JSONObject().put(PushPlugin.EVENT, ERROR_EVENT);
            json.put(ADMMessageHandler.ERROR_MSG, errorId);

            PushPlugin.sendJavascript(json);
        } catch (Exception e) {
            Log.getStackTraceString(e);
        }
    }

    /** {@inheritDoc} */
    @Override
    protected void onMessage(final Intent intent) {
        // Extract the message content from the set of extras attached to
        // the com.amazon.device.messaging.intent.RECEIVE intent.

        // Extract the payload from the message
        Bundle extras = intent.getExtras();
        if (extras != null && (extras.getString(PushPlugin.MESSAGE) != null)) {
            // if we are in the foreground, just surface the payload, else post
            // it to the statusbar
            if (PushPlugin.isInForeground()) {
                extras.putBoolean(PushPlugin.FOREGROUND, true);
                PushPlugin.sendExtras(extras);
            } else {
                extras.putBoolean(PushPlugin.FOREGROUND, false);
                createNotification(this, extras);
            }
        }
    }

    /**
     * Creates a notification when app is not running or is not in foreground. It puts the message info into the Intent
     * extra
     * 
     * @param context
     * @param extras
     */
    public void createNotification(Context context, Bundle extras) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        String appName = getAppName(this);

        // reuse the intent so that we can combine multiple messages into extra
        if (notificationIntent == null) {
            notificationIntent = new Intent(this, ADMHandlerActivity.class);
        }
        notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP
            | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        notificationIntent.putExtra("pushBundle", extras);

        PendingIntent contentIntent = PendingIntent.getActivity(this, 0,
            notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);

        final Builder notificationBuilder = new Notification.Builder(context);
        notificationBuilder.setSmallIcon(context.getApplicationInfo().icon)
            .setWhen(System.currentTimeMillis())
            .setContentIntent(contentIntent);

        if (this.shouldShowMessageInNotification()) {
            String message = extras.getString(PushPlugin.MESSAGE);
            notificationBuilder.setContentText(Html.fromHtml(message).toString());
        } else {
            notificationBuilder.setContentText(this.defaultMessageTextInNotification());
        }

        String title = appName;
        notificationBuilder.setContentTitle(title).setTicker(title);
        notificationBuilder.setAutoCancel(true);
        // Because the ID remains unchanged, the existing notification is updated.
        notificationManager.notify((String) appName, NOTIFICATION_ID,
            notificationBuilder.getNotification());
    }

    public static void cancelNotification(Context context) {
        NotificationManager mNotificationManager = (NotificationManager) context
            .getSystemService(Context.NOTIFICATION_SERVICE);
        mNotificationManager.cancel((String) getAppName(context),
            NOTIFICATION_ID);
    }

    private static String getAppName(Context context) {
        CharSequence appName = context.getPackageManager().getApplicationLabel(
            context.getApplicationInfo());
        return (String) appName;
    }

    // clean up the message in the intent
    static void cleanupNotificationIntent() {
        if (notificationIntent != null) {
            Bundle pushBundle = notificationIntent.getExtras().getBundle(
                PUSH_BUNDLE);
            if (pushBundle != null) {
                pushBundle.clear();
            }

        }
    }

    public static Bundle getOfflineMessage() {
        Bundle pushBundle = null;
        if (notificationIntent != null) {
            pushBundle = notificationIntent.getExtras().getBundle(PUSH_BUNDLE);
            if (pushBundle.isEmpty()) {
                pushBundle = null;
            }
        }
        return pushBundle;
    }

    /**
     * Reads "shownotificationmessage" & "defaultnotificationmessage" config options
     * If this is first-time it saves them to sharedPreferences so they can be read
     * when app is forced-stop or killed
     */
    public static void saveConfigOptions(Context context) {
        if (context != null && TextUtils.isEmpty(defaultOfflineMessage)) {
            // read config options from config.xml
            shouldShowOfflineMessage = ((CordovaActivity) context)
                .getBooleanProperty(SHOW_MESSAGE_PREF, false);
            defaultOfflineMessage = ((CordovaActivity) context)
                .getStringProperty(DEFAULT_MESSAGE_PREF, null);

            // save them to sharedPreferences if necessary
            SharedPreferences config = context.getApplicationContext().getSharedPreferences(PREFS_NAME, 0);
            SharedPreferences.Editor editor = config.edit();
            editor.putBoolean(SHOW_MESSAGE_PREF, shouldShowOfflineMessage);
            editor.putString(DEFAULT_MESSAGE_PREF, defaultOfflineMessage);
            // save prefs to disk
            editor.commit();
        }

    }
    
    /**
     * Gets "shownotificationmessage" config option
     * 
     * @return returns boolean- true is shownotificationmessage is set to true in config.xml/sharedPreferences otherwise false
     */
    private boolean shouldShowMessageInNotification() {
        //check if have cached copy of this option
        if (TextUtils.isEmpty(defaultOfflineMessage)) {
            //need to read it from sharedPreferences
            SharedPreferences config = this.getApplicationContext().getSharedPreferences(PREFS_NAME,0);
            if (config != null) {
                shouldShowOfflineMessage = config.getBoolean(SHOW_MESSAGE_PREF, true);
            }
        }
        return shouldShowOfflineMessage;
    }
    
    /**
     * Gets "defaultnotificationmessage" config option
     * 
     * @return returns default message provided by user in cofing.xml/sharedPreferences
     */
    private String defaultMessageTextInNotification() {
      //check if have cached copy of this option
        if (TextUtils.isEmpty(defaultOfflineMessage)) {
            SharedPreferences config = this.getApplicationContext().getSharedPreferences(PREFS_NAME,0);
            if (config != null) {
                defaultOfflineMessage = config.getString(DEFAULT_MESSAGE_PREF, DEFAULT_MESSAGE_TEXT);
            }
        }
        return defaultOfflineMessage;
    }
}
