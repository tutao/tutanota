/*
 * Copyright (c) 2014-2015 by appPlant UG. All rights reserved.
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

import org.json.JSONObject;

import java.util.List;

/**
 * This class is triggered upon reboot of the device. It needs to re-register
 * the alarms with the AlarmManager since these alarms are lost in case of
 * reboot.
 */
abstract public class AbstractRestoreReceiver extends BroadcastReceiver {

    /**
     * Called on device reboot.
     *
     * @param context
     *      Application context
     * @param intent
     *      Received intent with content data
     */
    @Override
    public void onReceive (Context context, Intent intent) {
        Manager notificationMgr =
                Manager.getInstance(context);

        List<JSONObject> options =
                notificationMgr.getOptions();

        for (JSONObject data : options) {
            Builder builder = new Builder(context, data);

            Notification notification =
                    buildNotification(builder);

            onRestore(notification);
        }
    }

    /**
     * Called when a local notification need to be restored.
     *
     * @param notification
     *      Wrapper around the local notification
     */
    abstract public void onRestore (Notification notification);

    /**
     * Build notification specified by options.
     *
     * @param builder
     *      Notification builder
     */
    abstract public Notification buildNotification (Builder builder);

}
