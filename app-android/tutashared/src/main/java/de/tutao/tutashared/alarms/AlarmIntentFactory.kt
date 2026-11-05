package de.tutao.tutashared.alarms

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import de.tutao.tutashared.TAG
import de.tutao.tutashared.alarms.AlarmBroadcastReceiver.Companion.EVENT_DATE_EXTRA
import de.tutao.tutashared.alarms.AlarmBroadcastReceiver.Companion.IS_ALL_DAY_EVENT
import de.tutao.tutashared.alarms.AlarmBroadcastReceiver.Companion.SUMMARY_EXTRA
import java.util.Date

class AlarmIntentFactory(val mainActivity: Class<*>) {
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
		intent.putExtra(OPEN_USER_MAILBOX_USER_ID_KEY, userId) // TODO: Figure out where to store this other than MainActivity.companionObject.OPEN_USER_MAILBOX_USER_ID_KEY
		intent.putExtra(IS_ALL_DAY_EVENT, isAllDayEvent)
		Log.d(TAG, "creating alarm intent for ${AlarmBroadcastReceiver::class.java}")
		return intent
	}

	companion object {
		const val OPEN_USER_MAILBOX_USER_ID_KEY = "userId"
	}
}