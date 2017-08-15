package de.tutao.tutanota.push;

import android.content.Context;
import android.os.Bundle;
import android.os.Vibrator;

import com.google.android.gms.gcm.GcmListenerService;

/**
 * Created by mpfau on 4/16/17.
 */

public class GcmListener extends GcmListenerService {

    @Override
    public void onMessageReceived(String s, Bundle data) {
        super.onMessageReceived(s, data);
        Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        v.vibrate(300);
    }
}
