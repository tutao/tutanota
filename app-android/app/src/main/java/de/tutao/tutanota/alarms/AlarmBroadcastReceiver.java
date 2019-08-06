package de.tutao.tutanota.alarms;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.support.v4.app.NotificationCompat;
import de.tutao.tutanota.MainActivity;
import de.tutao.tutanota.R;

import java.util.Date;

import static de.tutao.tutanota.Utils.atLeastOreo;
import static de.tutao.tutanota.push.PushNotificationService.VIBRATION_PATTERN;

public class AlarmBroadcastReceiver extends BroadcastReceiver {
	public static final String ALARM_NOTIFICATION_CHANNEL_ID = "alarms";
	private static final String TAG = "AlarmBroadcastReceiver";

	private static final String SUMMARY_EXTRA = "summary";
	public static final String EVENT_DATE_EXTRA = "eventDate";

	public static Intent makeAlarmIntent(Context context, int occurrence, String identifier, String summary, Date eventDate, String userId) {
		String occurrenceIdentifier = identifier + "#" + occurrence;
		Intent intent = new Intent(context, AlarmBroadcastReceiver.class);
		intent.setData(Uri.fromParts("alarm", occurrenceIdentifier, ""));
		intent.putExtra(SUMMARY_EXTRA, summary);
		intent.putExtra(EVENT_DATE_EXTRA, eventDate.getTime());
		intent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId);
		return intent;
	}

	@Override
	public void onReceive(Context context, Intent intent) {
		NotificationManager notificationManager =
				(NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
		createNotificationChannel(notificationManager, context);
		String contentText = String.format("%tR %s", intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis()), intent.getStringExtra(SUMMARY_EXTRA));
		notificationManager.notify((int) System.currentTimeMillis(),
				new NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
						.setSmallIcon(R.drawable.ic_status)
						.setContentTitle(context.getString(R.string.reminder_label))
						.setContentText(contentText)
						.setDefaults(NotificationCompat.DEFAULT_ALL)
						.setColor(context.getResources().getColor(R.color.colorPrimary))
						.setContentIntent(openCalendarIntent(context, intent))
						.build());
	}

	private PendingIntent openCalendarIntent(Context context, Intent alarmIntent) {
		String userId = alarmIntent.getStringExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY);
		Intent openMailboxIntent = new Intent(context, MainActivity.class);
		openMailboxIntent.setAction(MainActivity.OPEN_CALENDAR_ACTION);
		openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId);
		return PendingIntent.getActivity(
				context,
				alarmIntent.getData().toString().hashCode(),
				openMailboxIntent,
				PendingIntent.FLAG_UPDATE_CURRENT);
	}

	public static void createNotificationChannel(NotificationManager notificationManager, Context context) {
		if (atLeastOreo()) {
			NotificationChannel notificationsChannel = new NotificationChannel(
					ALARM_NOTIFICATION_CHANNEL_ID, context.getString(R.string.reminder_label), NotificationManager.IMPORTANCE_HIGH);
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
}
