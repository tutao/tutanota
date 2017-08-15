package de.tutao.tutanota.push;

import android.app.IntentService;
import android.content.Intent;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.android.gms.gcm.GoogleCloudMessaging;
import com.google.android.gms.iid.InstanceID;

import org.jdeferred.FailCallback;

import java.io.IOException;

import de.tutao.tutanota.JsRequest;
import de.tutao.tutanota.R;

import static de.tutao.tutanota.MainActivity.activity;

/**
 * Created by mpfau on 4/16/17.
 */
public class GcmRegistrationService extends IntentService {
    static String SenderId = "707517914653";
    static String TAG = "GcmRegistrationService";

    public GcmRegistrationService() {
        super("GcmRegistrationService");
    }

    @Override
    protected void onHandleIntent(@Nullable Intent intent) {
        InstanceID instanceID = InstanceID.getInstance(this);
        try {
            String token = instanceID.getToken(SenderId,
                    GoogleCloudMessaging.INSTANCE_ID_SCOPE, null);
            activity.nativeImpl.sendRequest(JsRequest.updatePushIdentifier, new Object[] { token }).fail(new FailCallback<Exception>() {
                @Override
                public void onFail(Exception e) {
                    Log.e(TAG, "could not retrieve token", e);
                }
            });
        } catch (IOException e) {
            Log.e(TAG, "could not retrieve token", e);
        }
    }


}
