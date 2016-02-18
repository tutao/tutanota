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

/**
 * Abstract delete receiver for local notifications. Creates the local
 * notification and calls the event functions for further proceeding.
 */
abstract public class AbstractClearReceiver extends BroadcastReceiver {

    /**
     * Called when the notification was cleared from the notification center.
     *
     * @param context
     *      Application context
     * @param intent
     *      Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle bundle  = intent.getExtras();
        JSONObject options;

        try {
            String data = bundle.getString(Options.EXTRA);
            options = new JSONObject(data);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        Notification notification =
                new Builder(context, options).build();

        onClear(notification);
    }

    /**
     * Called when a local notification was cleared from outside of the app.
     *
     * @param notification
     *      Wrapper around the local notification
     */
    abstract public void onClear (Notification notification);

}
