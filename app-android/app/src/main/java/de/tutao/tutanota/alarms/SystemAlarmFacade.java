package de.tutao.tutanota.alarms;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import java.util.Date;

public class SystemAlarmFacade {

	private static final String TAG = "SystemAlarmFacade";
	private final Context context;

	public SystemAlarmFacade(Context context) {

		this.context = context;
	}

	public void scheduleAlarmOccurrenceWithSystem(Date alarmTime, int occurrence,
												  String identifier, String summary,
												  Date eventDate, String user) {
		Log.d(TAG, "Scheduled notification " + identifier);
		AlarmManager alarmManager = getAlarmManager();
		PendingIntent pendingIntent = makeAlarmPendingIntent(occurrence, identifier, summary, eventDate, user);

		alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmTime.getTime(), pendingIntent);
	}

	public void cancelAlarm(String identifier, int occurrence) {
		// For cancellation we make alarms which are almost the same. Intent#filterEquals checks that action, data, type, class, and categories are the same.
		// It doesn't check extras. "data" (read: uri) is the only significant part. It is made up of alarm identifier and occurrence. We provide other fields
		// as a filler but this doesn't make a difference.
		getAlarmManager().cancel(makeAlarmPendingIntent(occurrence, identifier, "", new Date(), ""));
	}

	private AlarmManager getAlarmManager() {
		return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
	}

	private PendingIntent makeAlarmPendingIntent(int occurrence, String identifier, String summary,
												 Date eventDate, String user) {
		Intent intent =
				AlarmBroadcastReceiver.makeAlarmIntent(context, occurrence, identifier, summary, eventDate, user);
		return PendingIntent.getBroadcast(context, 1, intent, 0);
	}

}
