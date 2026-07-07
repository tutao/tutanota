package de.tutao.calendar.alarms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import de.tutao.calendar.R
import de.tutao.calendar.push.makeOpenCalendarIntent
import de.tutao.tutashared.alarms.AlarmNotificationsManager.Companion.showAlarmNotification
import de.tutao.tutashared.alarms.NotificationResources

class CalendarAlarmBroadcastReceiver : BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		Log.d(TAG, "Received alarm broadcast")
		val timestamp = intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis())
		val summary = intent.getStringExtra(SUMMARY_EXTRA)
		val isAllDayEvent = intent.getBooleanExtra(IS_ALL_DAY_EVENT, false)

		val resources = NotificationResources(R.color.dark_blue, R.drawable.ic_alarm, R.string.reminder_label)

		showAlarmNotification(
			context,
			timestamp,
			summary!!,
			isAllDayEvent,
			makeOpenCalendarIntent(context, intent),
			resources
		)
	}

	companion object {
		const val TAG = "AlarmBroadcastReceiver"
		const val SUMMARY_EXTRA = "summary"
		const val EVENT_DATE_EXTRA = "eventDate"
		const val IS_ALL_DAY_EVENT = "isAllDayEvent"
	}
}