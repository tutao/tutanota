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

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class ReceiverActivity extends Activity {

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = this.getIntent();
        Bundle bundle = intent.getExtras();

        try {
            JSONObject args = new JSONObject(bundle.getString(Receiver.OPTIONS));
            Options options = new Options(getApplicationContext()).parse(args);

            launchMainIntent();
            fireClickEvent(options);
        } catch (JSONException e) {}
    }

    /**
     * Launch main intent for package.
     */
    private void launchMainIntent () {
        Context context     = getApplicationContext();
        String packageName  = context.getPackageName();
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(launchIntent);
    }

    /**
     * Fires the onclick event.
     */
    private void fireClickEvent (Options options) {
        LocalNotification.fireEvent("click", options.getId(), options.getJSON());

        if (options.getAutoCancel()) {
            LocalNotification.fireEvent("cancel", options.getId(), options.getJSON());
        }
    }
}
