package de.tutao.calendar.alarms

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.Date


class SystemAlarmFacade(private val context: Context) {
	fun scheduleAlarmOccurrenceWithSystem(
		alarmTime: Date,
		occurrence: Int,
		identifier: String,
		summary: String,
		eventDate: Date,
		user: String
	) {
		Log.d(TAG, "Scheduled notification $identifier")
		val alarmManager = alarmManager
		val pendingIntent = makeAlarmPendingIntent(occurrence, identifier, summary, eventDate, user)
		alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmTime.time, pendingIntent)
	}

	fun cancelAlarm(identifier: String, occurrence: Int) {
		// For cancellation we make alarms which are almost the same. Intent#filterEquals checks that action, data, type, class, and categories are the same.
		// It doesn't check extras. "data" (read: uri) is the only significant part. It is made up of alarm identifier and occurrence. We provide other fields
		// as a filler but this doesn't make a difference.
		alarmManager.cancel(makeAlarmPendingIntent(occurrence, identifier, "", Date(), ""))
	}

	private val alarmManager: AlarmManager
		get() = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

	private fun makeAlarmPendingIntent(
		occurrence: Int,
		identifier: String,
		summary: String,
		eventDate: Date,
		user: String?
	): PendingIntent {
		val intent: Intent =
			AlarmBroadcastReceiver.makeAlarmIntent(context, occurrence, identifier, summary, eventDate, user)
		return PendingIntent.getBroadcast(context, 1, intent, PendingIntent.FLAG_IMMUTABLE)
	}

	companion object {
		private const val TAG = "SystemAlarmFacade"
	}
}