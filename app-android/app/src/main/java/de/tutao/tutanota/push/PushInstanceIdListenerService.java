package de.tutao.tutanota.push;

import android.content.Intent;

import com.google.android.gms.iid.InstanceIDListenerService;

/**
 * Created by mpfau on 4/16/17.
 */

public class PushInstanceIdListenerService extends InstanceIDListenerService {
    @Override
    public void onTokenRefresh() {
        Intent intent = new Intent(this, GcmRegistrationService.class);
        startService(intent);
    }
}
