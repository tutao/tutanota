package de.tutao.tutashared.alarms

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import de.tutao.tutashared.R
import de.tutao.tutashared.alarms.AlarmNotificationsManager.Companion.showAlarmNotification


class AlarmBroadcastReceiver : BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		Log.d(TAG, "Received alarm broadcast")
		val timestamp = intent.getLongExtra(EVENT_DATE_EXTRA, System.currentTimeMillis())
		val summary = intent.getStringExtra(SUMMARY_EXTRA)
		val isAllDayEvent = intent.getBooleanExtra(IS_ALL_DAY_EVENT, false)

		val resources = NotificationResources(R.color.red, R.drawable.ic_alarm, R.string.reminder_label)

		showAlarmNotification(
			context,
			timestamp,
			summary!!,
			isAllDayEvent,
			makeOpenCalendarIntent(context, intent),
			resources
		)
	}

	fun makeOpenCalendarIntent(context: Context, alarmIntent: Intent): PendingIntent {
		val userId = alarmIntent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY)
		val mainActivityClass = getMainActivityClass(context)
		val openCalendarEventIntent = Intent(context, mainActivityClass)
		Log.d(TAG, "creating openCalendarIntent for class $mainActivityClass")
		openCalendarEventIntent.action = OPEN_CALENDAR_ACTION
		openCalendarEventIntent.putExtra(OPEN_USER_MAILBOX_USERID_KEY, userId)
		return PendingIntent.getActivity(
			context,
			alarmIntent.data.toString().hashCode(),
			openCalendarEventIntent,
			PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
		)
	}

	companion object {
		const val TAG = "AlarmBroadcastReceiver"
		const val SUMMARY_EXTRA = "summary"
		const val EVENT_DATE_EXTRA = "eventDate"
		const val IS_ALL_DAY_EVENT = "isAllDayEvent"
		//  TODO: Decide where these actually belong
		// don't remove the trailing slash because otherwise longer domains might match our asset check
		const val BASE_WEB_VIEW_URL = "https://assets.tutanota.com/"
		const val OPEN_CALENDAR_ACTION = "de.tutao.calendar.OPEN_CALENDAR_ACTION"
		const val OPEN_LOGS_ACTION = "de.tutao.calendar.OPEN_CALENDAR_LOGS"
		const val OPEN_LOGS_DATA_KEY = "logs"
		const val OPEN_USER_MAILBOX_USERID_KEY = "userId"
		const val ALREADY_HANDLED_INTENT = "alreadyHandledIntent"
		const val OPEN_CALENDAR_IN_APP_ACTION_KEY = "inAppAction"
		const val OPEN_CALENDAR_DATE_KEY = "targetDate"
		const val OPEN_CALENDAR_EVENT_KEY = "eventId"
	}
}

/**
 * Get the MainActivity class of whatever application this LocalNotificationsFacade is attached to.
 * This allows us to generalize the intents that are created in the
 *
 * context.packageManager.getLaunchIntentForPackage() finds our MainActivity class because our AndroidManifest.xml designates
 * our MainActivity with an intent filter that says "android.intent.category.LAUNCHER", which is standard practice for
 * apps that can be launched from the Home Screen.
 *
 * More info: https://developer.android.com/guide/components/intents-filters#imatch
 *
 * This solution was sourced from:
 * https://stackoverflow.com/questions/10573930/how-to-get-main-activity-class-or-class-name-of-my-application#16608111
 */
fun getMainActivityClass(context: Context): Class<*> {
	val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
	val className = launchIntent!!.component!!.className // TODO: add error handling
	val loadedClass = context.classLoader.loadClass(className) // THIS WORKS!!

	return loadedClass
}

