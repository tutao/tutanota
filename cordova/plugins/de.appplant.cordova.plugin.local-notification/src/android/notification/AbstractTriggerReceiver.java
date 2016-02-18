/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.notification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Abstract broadcast receiver for local notifications. Creates the
 * notification options and calls the event functions for further proceeding.
 */
abstract public class AbstractTriggerReceiver extends BroadcastReceiver {

    /**
     * Called when an alarm was triggered.
     *
     * @param context
     *      Application context
     * @param intent
     *      Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle bundle  = intent.getExtras();
        Options options;

        try {
            String data = bundle.getString(Options.EXTRA);
            JSONObject dict = new JSONObject(data);

            options = new Options(context).parse(dict);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        if (options == null)
            return;

        if (isFirstAlarmInFuture(options))
            return;

        Builder builder = new Builder(options);
        Notification notification = buildNotification(builder);
        boolean updated = notification.isUpdate(false);

        onTrigger(notification, updated);
    }

    /**
     * Called when a local notification was triggered.
     *
     * @param notification
     *      Wrapper around the local notification
     * @param updated
     *      If an update has triggered or the original
     */
    abstract public void onTrigger (Notification notification, boolean updated);

    /**
     * Build notification specified by options.
     *
     * @param builder
     *      Notification builder
     */
    abstract public Notification buildNotification (Builder builder);

    /*
     * If you set a repeating alarm at 11:00 in the morning and it
     * should trigger every morning at 08:00 o'clock, it will
     * immediately fire. E.g. Android tries to make up for the
     * 'forgotten' reminder for that day. Therefore we ignore the event
     * if Android tries to 'catch up'.
     */
    private Boolean isFirstAlarmInFuture (Options options) {
        Notification notification = new Builder(options).build();

        if (!notification.isRepeating())
            return false;

        Calendar now    = Calendar.getInstance();
        Calendar alarm  = Calendar.getInstance();

        alarm.setTime(notification.getOptions().getTriggerDate());

        int alarmHour   = alarm.get(Calendar.HOUR_OF_DAY);
        int alarmMin    = alarm.get(Calendar.MINUTE);
        int currentHour = now.get(Calendar.HOUR_OF_DAY);
        int currentMin  = now.get(Calendar.MINUTE);

        return (currentHour != alarmHour && currentMin != alarmMin);
    }

}
