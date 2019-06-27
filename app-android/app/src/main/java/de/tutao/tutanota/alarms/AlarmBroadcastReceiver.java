package de.tutao.tutanota.alarms;

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
import de.tutao.tutanota.R;

import java.util.Date;

import static de.tutao.tutanota.Utils.atLeastOreo;
import static de.tutao.tutanota.push.PushNotificationService.VIBRATION_PATTERN;

public class AlarmBroadcastReceiver extends BroadcastReceiver {
	private static final String ALARM_NOTIFICATION_CHANNEL_ID = "alarms";
	private static final String TAG = "AlarmBroadcastReceiver";

	private static final String SUMMARY_EXTRA = "summary";
	public static final String EVENT_DATE_EXTRA = "eventDate";

	public static Intent makeAlarmIntent(int occurrence, String identifier, String summary, Date eventDate) {
		String occurrenceIdentifier = identifier + "#" + occurrence;
		Intent intent = new Intent("de.tutao.tutanota.ALARM", Uri.fromParts("alarm", occurrenceIdentifier, ""));
		intent.putExtra(SUMMARY_EXTRA, summary);
		intent.putExtra(EVENT_DATE_EXTRA, eventDate.getTime());
		return intent;
	}

	@Override
	public void onReceive(Context context, Intent intent) {
		Log.d(TAG, "Received broadcast");
		NotificationManager notificationManager =
				(NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
		if (atLeastOreo()) {
			createNotificationChannel(notificationManager, context);
		}
		notificationManager.notify((int) System.currentTimeMillis(),
				new NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
						.setSmallIcon(R.drawable.ic_status)
						.setContentTitle(context.getString(R.string.calendarReminder_label))
						.setColor(context.getResources().getColor(R.color.colorPrimary))
						.setContentText(intent.getStringExtra(SUMMARY_EXTRA))
						.setWhen(intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis()))
						.setDefaults(NotificationCompat.DEFAULT_SOUND)
						.build());
	}


	@TargetApi(Build.VERSION_CODES.O)
	void createNotificationChannel(NotificationManager notificationManager, Context context) {
		NotificationChannel notificationsChannel = new NotificationChannel(
				ALARM_NOTIFICATION_CHANNEL_ID, context.getString(R.string.calendarReminder_label), NotificationManager.IMPORTANCE_HIGH);
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
