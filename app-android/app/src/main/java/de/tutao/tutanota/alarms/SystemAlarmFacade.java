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

	void scheduleAlarmOccurrenceWithSystem(Date alarmTime, int occurrence,
										   String identifier, String summary,
										   Date eventDate, String user) {
		Log.d(TAG, "Scheduled notification " + identifier + " at: " + alarmTime);
		AlarmManager alarmManager = getAlarmManager();
		PendingIntent pendingIntent = makeAlarmPendingIntent(occurrence, identifier, summary, eventDate, user);

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
			alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmTime.getTime(), pendingIntent);
		} else {
			alarmManager.setExact(AlarmManager.RTC_WAKEUP, alarmTime.getTime(), pendingIntent);
		}
	}

	public void cancelAlarm(String identifier, int occurrence) {
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
