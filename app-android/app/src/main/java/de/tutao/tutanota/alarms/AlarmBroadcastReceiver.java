package de.tutao.tutanota.alarms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import java.util.Date;

import de.tutao.tutanota.MainActivity;
import de.tutao.tutanota.push.LocalNotificationsFacade;

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
		Log.d(TAG, "Received alarm broadcast");
		long when = intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis());
		String summary = intent.getStringExtra(SUMMARY_EXTRA);
		LocalNotificationsFacade.showAlarmNotification(context, when, summary, intent);
	}
}
