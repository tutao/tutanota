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

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;

public class ADMHandlerActivity extends Activity {

    /*
     * this activity will be started if the user touches a notification that we own. We send it's data off to the push
     * plugin for processing. If needed, we boot up the main activity to kickstart the application.
     * @see android.app.Activity#onCreate(android.os.Bundle)
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        boolean isPushPluginActive = PushPlugin.isActive();
        processPushBundle(isPushPluginActive);
        finish();
        if (!isPushPluginActive) {
            forceMainActivityReload();
        }
    }

    /**
     * Takes the pushBundle extras from the intent, and sends it through to the PushPlugin for processing.
     */
    private void processPushBundle(boolean isCordovaActive) {
        Bundle extras = getIntent().getExtras();

        if (extras != null) {
            Bundle originalExtras = extras
                .getBundle(ADMMessageHandler.PUSH_BUNDLE);
            originalExtras.putBoolean(PushPlugin.COLDSTART, !isCordovaActive);
            ADMMessageHandler.cancelNotification(this);
            PushPlugin.sendExtras(originalExtras);
            // clean up the noticiationIntent extra
            ADMMessageHandler.cleanupNotificationIntent();
        }
    }

    /**
     * Forces the main activity to re-launch if it's unloaded.
     */
    private void forceMainActivityReload(/* Bundle extras */) {
        PackageManager pm = getPackageManager();
        Intent launchIntent = pm
            .getLaunchIntentForPackage(getApplicationContext()
                .getPackageName());
        startActivity(launchIntent);
    }

}
