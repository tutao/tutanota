package de.tutao.calendar.alarms

import android.content.Context
import android.content.Intent
import android.net.Uri
import de.tutao.calendar.MainActivity
import de.tutao.calendar.alarms.CalendarAppAlarmBroadcastReceiver.Companion.EVENT_DATE_EXTRA
import de.tutao.calendar.alarms.CalendarAppAlarmBroadcastReceiver.Companion.IS_ALL_DAY_EVENT
import de.tutao.calendar.alarms.CalendarAppAlarmBroadcastReceiver.Companion.SUMMARY_EXTRA
import de.tutao.tutashared.alarms.AlarmIntentFactory
import java.util.Date

class CalendarAppAlarmIntentFactory : AlarmIntentFactory {
	override fun makeAlarmIntent(
		context: Context,
		occurrence: Int,
		identifier: String,
		summary: String?,
		eventDate: Date,
		isAllDayEvent: Boolean,
		userId: String?
	): Intent {
		val occurrenceIdentifier = "$identifier#$occurrence"
		val intent = Intent(context, CalendarAppAlarmBroadcastReceiver::class.java)
		intent.data = Uri.fromParts("alarm", occurrenceIdentifier, "")
		intent.putExtra(SUMMARY_EXTRA, summary)
		intent.putExtra(EVENT_DATE_EXTRA, eventDate.time)
		intent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		intent.putExtra(IS_ALL_DAY_EVENT, isAllDayEvent)
		return intent
	}
}