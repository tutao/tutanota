package de.tutao.tutanota.push;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.core.content.ContextCompat;

public class BootBroadcastReceiver extends BroadcastReceiver {
	@Override
	public void onReceive(Context context, Intent intent) {
		Log.d("BootBroadcastReceiver", "Got intent" + intent);
		if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) || "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {
			Log.d("BootBroadcastReceiver", "on boot");
			Intent serviceIntent = new Intent(context, PushNotificationService.class);
			ContextCompat.startForegroundService(context, serviceIntent);
		}
	}
}
