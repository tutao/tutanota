package com.adobe.phonegap.push;

import android.content.Intent;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.android.gms.iid.InstanceID;
import com.google.android.gms.iid.InstanceIDListenerService;

import org.json.JSONException;

import java.io.IOException;

public class PushInstanceIDListenerService extends InstanceIDListenerService implements PushConstants {
    public static final String LOG_TAG = "PushPlugin_PushInstanceIDListenerService";

    @Override
    public void onTokenRefresh() {
        SharedPreferences sharedPref = getApplicationContext().getSharedPreferences(COM_ADOBE_PHONEGAP_PUSH, Context.MODE_PRIVATE);
        String senderID = sharedPref.getString(SENDER_ID, "");
        if (!"".equals(senderID)) {
            Intent intent = new Intent(this, RegistrationIntentService.class);
                startService(intent);
        }
    }
}
