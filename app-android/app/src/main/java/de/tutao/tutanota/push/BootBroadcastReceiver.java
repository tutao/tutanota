package de.tutao.tutanota.push;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.support.v4.content.ContextCompat;
import android.util.Log;

public class BootBroadcastReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
      if (Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(intent.getAction()) || Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
          Log.d("BootBroadcastReceiver", "on boot");
          Intent serviceIntent = new Intent(context, PushNotificationService.class);
          ContextCompat.startForegroundService(context, serviceIntent);
      }
  }
}
