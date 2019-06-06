package de.tutao.tutanota;

import android.annotation.TargetApi;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import static de.tutao.tutanota.Utils.atLeastOreo;
import static de.tutao.tutanota.push.PushNotificationService.VIBRATION_PATTERN;

public class AlarmBroadcastReceiver extends BroadcastReceiver {
    private static final String ALARM_NOTIFICATION_CHANNEL_ID = "alarms";
    private static final String TAG = "AlarmBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received broadcast");
        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (atLeastOreo()) {
            createNotificationChannel(notificationManager);
        }
        notificationManager.notify((int) System.currentTimeMillis(),
                new NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
                        .setSmallIcon(R.drawable.ic_status)
                        .setContentTitle("Reminder")
                        .setColor(context.getResources().getColor(R.color.colorPrimary))
                        .setContentText("Tutanota calendar notification" + intent.getData())
                        .setDefaults(NotificationCompat.DEFAULT_SOUND)
                        .build());
    }


    @TargetApi(Build.VERSION_CODES.O)
    void createNotificationChannel(NotificationManager notificationManager) {
        NotificationChannel notificationsChannel = new NotificationChannel(
                ALARM_NOTIFICATION_CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH);
        notificationsChannel.setShowBadge(true);
        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        AudioAttributes att = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
                .build();
        notificationsChannel.setSound(ringtoneUri, att);
        notificationsChannel.setVibrationPattern(VIBRATION_PATTERN);
        notificationsChannel.enableLights(true);
        notificationsChannel.setLightColor(Color.RED);
        notificationsChannel.setShowBadge(true);
        notificationManager.createNotificationChannel(notificationsChannel);
    }
}
