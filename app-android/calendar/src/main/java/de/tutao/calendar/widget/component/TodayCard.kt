package de.tutao.calendar.widget.component

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.action.actionStartActivity
import de.tutao.calendar.MainActivity
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.tutashared.ipc.CalendarOpenAction
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Date

@Composable
fun TodayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	cardAction: Action,
	currentDay: Date,
) {
	fun openCalendarEditor(context: Context, userId: String? = ""): Action {
		val openCalendarEventEditor = Intent(context, MainActivity::class.java)
		openCalendarEventEditor.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarEventEditor.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarEventEditor.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarEventEditor.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.EVENT_EDITOR.value
		)
		openCalendarEventEditor.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		return actionStartActivity(openCalendarEventEditor)
	}

	Card(cardAction) {
		Header(allDayEvents, openCalendarEditor(LocalContext.current, userId))
		if (normalEvents.isEmpty()) {
			NoEventsToday()
		} else {
			EventList(userId, normalEvents, currentDay)
		}
	}
}