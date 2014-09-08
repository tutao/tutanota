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

import java.util.Calendar;
import java.util.Random;

import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationCompat.*;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

/**
 * The alarm receiver is triggered when a scheduled alarm is fired. This class
 * reads the information in the intent and displays this information in the
 * Android notification bar. The notification uses the default notification
 * sound and it vibrates the phone.
 */
public class Receiver extends BroadcastReceiver {

    public static final String OPTIONS = "LOCAL_NOTIFICATION_OPTIONS";

    private Context context;
    private Options options;

    @Override
    public void onReceive (Context context, Intent intent) {
        Options options = null;
        Bundle bundle   = intent.getExtras();
        JSONObject args;

        try {
            args    = new JSONObject(bundle.getString(OPTIONS));
            options = new Options(context).parse(args);
        } catch (JSONException e) {
            return;
        }

        this.context = context;
        this.options = options;

        // The context may got lost if the app was not running before
        LocalNotification.setContext(context);

        fireTriggerEvent();

        if (options.getInterval() == 0) {
            LocalNotification.unpersist(options.getId());
        } else if (isFirstAlarmInFuture()) {
            return;
        } else {
            LocalNotification.add(options.moveDate(), false);
        }

        Builder notification = buildNotification();

        showNotification(notification);
    }

    /*
     * If you set a repeating alarm at 11:00 in the morning and it
     * should trigger every morning at 08:00 o'clock, it will
     * immediately fire. E.g. Android tries to make up for the
     * 'forgotten' reminder for that day. Therefore we ignore the event
     * if Android tries to 'catch up'.
     */
    private Boolean isFirstAlarmInFuture () {
        if (options.getInterval() > 0) {
            Calendar now    = Calendar.getInstance();
            Calendar alarm  = options.getCalendar();

            int alarmHour   = alarm.get(Calendar.HOUR_OF_DAY);
            int alarmMin    = alarm.get(Calendar.MINUTE);
            int currentHour = now.get(Calendar.HOUR_OF_DAY);
            int currentMin  = now.get(Calendar.MINUTE);

            if (currentHour != alarmHour && currentMin != alarmMin) {
                return true;
            }
        }

        return false;
    }

    /**
     * Creates the notification.
     */
    @SuppressLint("NewApi")
    private Builder buildNotification () {
        Uri sound = options.getSound();

        Builder notification = new NotificationCompat.Builder(context)
            .setContentTitle(options.getTitle())
            .setContentText(options.getMessage())
            .setNumber(options.getBadge())
            .setTicker(options.getMessage())
            .setSmallIcon(options.getSmallIcon())
            .setLargeIcon(options.getIcon())
            .setAutoCancel(options.getAutoCancel())
            .setOngoing(options.getOngoing())
            .setLights(options.getColor(), 500, 500);

        if (sound != null) {
            notification.setSound(sound);
        }

        if (Build.VERSION.SDK_INT > 16) {
            notification.setStyle(new NotificationCompat.BigTextStyle()
                .bigText(options.getMessage()));
        }

        setClickEvent(notification);

        return notification;
    }

    /**
     * Adds an onclick handler to the notification
     */
    private Builder setClickEvent (Builder notification) {
        Intent intent = new Intent(context, ReceiverActivity.class)
            .putExtra(OPTIONS, options.getJSONObject().toString())
            .setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);

        int requestCode = new Random().nextInt();

        PendingIntent contentIntent = PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        return notification.setContentIntent(contentIntent);
    }

    /**
     * Shows the notification
     */
    @SuppressWarnings("deprecation")
    private void showNotification (Builder notification) {
        NotificationManager mgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        int id                  = 0;

        try {
            id = Integer.parseInt(options.getId());
        } catch (Exception e) {}

        if (Build.VERSION.SDK_INT<16) {
            // build notification for HoneyComb to ICS
            mgr.notify(id, notification.getNotification());
        } else if (Build.VERSION.SDK_INT>15) {
            // Notification for Jellybean and above
            mgr.notify(id, notification.build());
        }
    }

    /**
     * Fires ontrigger event.
     */
    private void fireTriggerEvent () {
        LocalNotification.fireEvent("trigger", options.getId(), options.getJSON());
    }
}
