package de.tutao.calendar.widget.component

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.MainActivity
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.ipc.CalendarOpenAction
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Composable
fun TodayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	cardAction: Action,
	currentDay: LocalDateTime,
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
			Column(
				modifier = GlanceModifier
					.fillMaxWidth()
					.padding(Dimensions.Spacing.MD.dp),
				horizontalAlignment = Alignment.CenterHorizontally,
				verticalAlignment = Alignment.CenterVertically
			) {
				Text(
//					LocalContext.current.getString(R.string.widgetNoEvents_msg),
					"No events today",

					style = TextStyle(
						color = GlanceTheme.colors.onBackground,
						fontSize = 16.sp
					),
					modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp, bottom = 0.dp)
				)
			}
		} else {
			EventList(userId, normalEvents, currentDay)
		}
	}
}