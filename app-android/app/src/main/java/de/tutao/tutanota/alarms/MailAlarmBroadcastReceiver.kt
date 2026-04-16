package de.tutao.tutanota.alarms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import de.tutao.tutanota.push.showAlarmNotification

class MailAlarmBroadcastReceiver : BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		Log.d(TAG, "Received alarm broadcast")
		val timestamp = intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis())
		val summary = intent.getStringExtra(SUMMARY_EXTRA)
		val isAllDayEvent = intent.getBooleanExtra(IS_ALL_DAY_EVENT, false)
		showAlarmNotification(context, timestamp, summary!!, isAllDayEvent, intent)
	}

	companion object {
		const val TAG = "AlarmBroadcastReceiver"
		const val SUMMARY_EXTRA = "summary"
		const val EVENT_DATE_EXTRA = "eventDate"
		const val IS_ALL_DAY_EVENT = "isAllDayEvent"
	}
}