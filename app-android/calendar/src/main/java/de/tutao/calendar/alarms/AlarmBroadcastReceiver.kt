package de.tutao.calendar.alarms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import de.tutao.calendar.MainActivity
import de.tutao.calendar.push.showAlarmNotification
import java.util.Date

class AlarmBroadcastReceiver : BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		Log.d(TAG, "Received alarm broadcast")
		val timestamp = intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis())
		val summary = intent.getStringExtra(SUMMARY_EXTRA)
		val isAllDayEvent = intent.getBooleanExtra(IS_ALL_DAY_EVENT, false)
		showAlarmNotification(context, timestamp, summary!!, isAllDayEvent, intent)
	}

	companion object {
		private const val TAG = "AlarmBroadcastReceiver"
		private const val SUMMARY_EXTRA = "summary"
		private const val EVENT_DATE_EXTRA = "eventDate"
		private const val IS_ALL_DAY_EVENT = "isAllDayEvent"

		fun makeAlarmIntent(
			context: Context,
			occurrence: Int,
			identifier: String,
			summary: String?,
			eventDate: Date,
			isAllDayEvent: Boolean,
			userId: String?
		): Intent {
			val occurrenceIdentifier = "$identifier#$occurrence"
			val intent = Intent(context, AlarmBroadcastReceiver::class.java)
			intent.data = Uri.fromParts("alarm", occurrenceIdentifier, "")
			intent.putExtra(SUMMARY_EXTRA, summary)
			intent.putExtra(EVENT_DATE_EXTRA, eventDate.time)
			intent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
			intent.putExtra(IS_ALL_DAY_EVENT, isAllDayEvent)
			return intent
		}
	}
}