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

import java.util.Set;

import org.json.JSONArray;
import org.json.JSONException;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * This class is triggered upon reboot of the device. It needs to re-register
 * the alarms with the AlarmManager since these alarms are lost in case of
 * reboot.
 */
public class Restore extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        // The application context needs to be set as first
        LocalNotification.setContext(context);

        // Obtain alarm details form Shared Preferences
        SharedPreferences alarms = LocalNotification.getSharedPreferences();
        Set<String> alarmIds     = alarms.getAll().keySet();

        /*
         * For each alarm, parse its alarm options and register is again with
         * the Alarm Manager
         */
        for (String alarmId : alarmIds) {
            try {
                JSONArray args  = new JSONArray(alarms.getString(alarmId, ""));
                Options options = new Options(context).parse(args.getJSONObject(0));

                /*
                 * If the trigger date was in the past, the notification will be displayed immediately.
                 */
                LocalNotification.add(options, false);

            } catch (JSONException e) {}
        }
    }
}
