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

package de.appplant.cordova.plugin.badge;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

public class LaunchActivity extends Activity {

    /**
     * Clears the badge and moves the launch intent
     * (web view) back to front.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent  = getIntent();
        boolean cancel = intent.getBooleanExtra(Badge.EXTRA_AUTO_CANCEL, false);

        if (cancel)
            clearBagde();

        launchMainIntent();
    }

    /**
     * Launch main intent for package.
     */
    private void launchMainIntent () {
        Context context = getApplicationContext();
        String pkgName  = context.getPackageName();
        Intent intent   = context.getPackageManager()
                .getLaunchIntentForPackage(pkgName);

        intent.addFlags(
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(intent);
    }

    /**
     * Removes the badge of the app icon so that `getBadge`
     * will return 0 back to the client.
     */
    private void clearBagde () {
        SharedPreferences.Editor editor = getSharedPreferences().edit();

        editor.putInt(Badge.KEY, 0);
        editor.apply();
    }

    /**
     * The Local storage for the application.
     */
    private SharedPreferences getSharedPreferences () {
        Context context = getApplicationContext();

        return context.getSharedPreferences(Badge.KEY, Context.MODE_PRIVATE);
    }
}
