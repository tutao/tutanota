package de.tutao.calendar.widget

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat.startActivity
import androidx.core.graphics.toColorInt
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.ImageProvider
import androidx.glance.LocalGlanceId
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.components.SquareIconButton
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.data.WidgetUIViewModel
import de.tutao.tutashared.ipc.CalendarOpenAction
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter


const val TAG = "VerticalWidget"

class VerticalWidget : GlanceAppWidget() {
	override suspend fun provideGlance(context: Context, id: GlanceId) {

		// Load data needed to render the AppWidget.
		// Use `withContext` to switch to another thread for long running
		// operations.
//		val db = AppDatabase.getDatabase(context, true)
//		val keyStoreFacade = createAndroidKeyStoreFacade()
//		val sseStorage = SseStorage(db, keyStoreFacade)
//		val userId = "OKV2uY3----4"
//
//		val crypto = AndroidNativeCryptoFacade(context)
//		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
//		val credentials = nativeCredentialsFacade.loadByUserId(userId)!!
//			.toSdkCredentials()
//
//		val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()).login(credentials)
//		val calendars = sdk.calendarFacade().getCalendarsRenderData()
//
//		val systemCalendar = Calendar.getInstance(TimeZone.getDefault())
//
//		val events = sdk.calendarFacade()
//			.getCalendarEvents(calendars.keys.first(), systemCalendar.timeInMillis.toULong())
//
//		val allEvents: List<CalendarEvent> = events.shortEvents.plus(events.longEvents)
//
//		// Remember mutable state for the data
////		val data = remember { mutableStateOf(allEvents) }
//
//		// Apply transformations to each item in the list
//		val allDayEvents: MutableList<UIEvent> = mutableListOf()
//		val normalEvents: MutableList<UIEvent> = mutableListOf()
//
//		val todayMidnight = Calendar.getInstance()
//		todayMidnight.set(Calendar.HOUR_OF_DAY, 0)
//		todayMidnight.set(Calendar.MINUTE, 0)
//		todayMidnight.set(Calendar.SECOND, 0)
//		todayMidnight.set(Calendar.MILLISECOND, 0)
//
//		val tomorrowMidnight = Calendar.getInstance()
//		tomorrowMidnight.add(Calendar.DAY_OF_YEAR, 1)
//		tomorrowMidnight.set(Calendar.HOUR_OF_DAY, 0)
//		tomorrowMidnight.set(Calendar.MINUTE, 0)
//		tomorrowMidnight.set(Calendar.SECOND, 0)
//		tomorrowMidnight.set(Calendar.MILLISECOND, 0)
//
//		allEvents.forEach { ev ->
//			val zoneId = ZoneId.systemDefault()
//			val start = LocalDateTime.ofInstant(Instant.ofEpochMilli(ev.startTime.toLong()), zoneId)
//			val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(ev.endTime.toLong()), zoneId)
//			val formatter = DateTimeFormatter.ofPattern("HH:mm")
//			val isAllDay = isAllDayEventByTimes(
//				Date.from(Instant.ofEpochMilli(ev.startTime.toLong())),
//				Date.from(Instant.ofEpochMilli(ev.endTime.toLong()))
//			) || (ev.startTime.toLong() < todayMidnight.timeInMillis && ev.endTime.toLong() >= tomorrowMidnight.timeInMillis)
//
//			val event = UIEvent(
//				"test",
//				"2196f3",
//				ev.summary,
//				start.format(formatter),
//				end.format(formatter),
//				isAllDay
//			)
//
//			if (isAllDay) {
//				allDayEvents.add(event)
//			} else {
//				normalEvents.add(event)
//			}
//		}
		provideContent {
			Log.d(TAG, "provideContent")

			val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(LocalGlanceId.current)
			val widgetUIViewModel = rememberSaveable(saver = WidgetUIViewModel.Saver) {
				WidgetUIViewModel(context, appWidgetId)
			}
			val data by widgetUIViewModel.uiState.collectAsState()
			val userId = widgetUIViewModel.getLoggedInUser()

//			val data = WidgetUIData(normalEvents, allDayEvents)

			GlanceTheme(
				colors = AppTheme.colors
			) {
				if (data != null && userId != null) {
					WidgetBody(
						data!!,
						headerCallback = { openCalendarAgenda(context, userId) },
						newEventCallback = { openCalendarEditor(context, userId) })
				}
			}
		}
	}

	private fun openCalendarEditor(context: Context, userId: String) {
		val openCalendarEventIntent = Intent(context, MainActivity::class.java)
		openCalendarEventIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarEventIntent.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarEventIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarEventIntent.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.EVENT_EDITOR.value
		)
		openCalendarEventIntent.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		startActivity(context, openCalendarEventIntent, null)
	}

	private fun openCalendarAgenda(context: Context, userId: String) {
		val openCalendarEventIntent = Intent(context, MainActivity::class.java)
		openCalendarEventIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarEventIntent.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarEventIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarEventIntent.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		startActivity(context, openCalendarEventIntent, null)
	}
}

@Composable
fun WidgetBody(data: WidgetUIData, headerCallback: () -> Unit, newEventCallback: () -> Unit) {
	println(data)
	Scaffold(
		modifier = GlanceModifier
			.padding(horizontal = 20.dp),
		backgroundColor = GlanceTheme.colors.background,
		horizontalPadding = 0.dp,
		titleBar = {
			Row(
				modifier = GlanceModifier.padding(vertical = 16.dp),
				verticalAlignment = Alignment.CenterVertically
			) {
				Header(
					allDayEventsCount = data.allDayEventsCount,
					onTap = headerCallback,
					onNewEvent = newEventCallback
				)
			}
		}
	) {
		// calendar events
		// we remove the scrollbar in res/values/styles.xml
		LazyColumn {
			itemsIndexed(data.normalEvents, itemId = { index, _ -> index.toLong() }) { _, event ->
				Column {
					EventCard(event)
					Spacer(modifier = GlanceModifier.height(4.dp))
				}
			}
		}
	}
}

@Composable
private fun Header(allDayEventsCount: Int, onTap: () -> Unit, onNewEvent: () -> Unit) {
	Column(
		modifier = GlanceModifier
			.clickable(rippleOverride = R.drawable.transparent_ripple) { onTap() }
	) {
		Text(
			style = TextStyle(
				fontWeight = FontWeight.Bold,
				fontSize = 16.sp,
				color = GlanceTheme.colors.secondary
			),
			text = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMMM")),
			maxLines = 1,
			modifier = GlanceModifier.padding(bottom = 4.dp)
		)
		// all day events
		// TODO() border is thicker in the corners. should probably switch to xml or no border
		Spacer(modifier = GlanceModifier.background(GlanceTheme.colors.primaryContainer).height(1.dp))

		if (allDayEventsCount > 0) {
			Text(
				modifier = GlanceModifier
					.padding(top = 4.dp),
				style = TextStyle(
					color = GlanceTheme.colors.secondary,
					fontSize = 14.sp
				),
				text = "$allDayEventsCount all day event"
			)
		}
	}
	// create event button
	Column(
		modifier = GlanceModifier
			.fillMaxWidth(),
		horizontalAlignment = Alignment.End
	) {
		SquareIconButton(
			imageProvider = ImageProvider(R.drawable.ic_add),
			contentDescription = "Add event button",
			onClick = { onNewEvent() },
			backgroundColor = GlanceTheme.colors.primary
		)
	}
}

@Composable
fun EventCard(event: UIEvent) {
	Row(
		modifier = GlanceModifier.padding(8.dp)
			.background(GlanceTheme.colors.surface)
			.cornerRadius(8.dp)
			.fillMaxWidth(),
		verticalAlignment = Alignment.CenterVertically
	) {
		CalendarIndicator(color = Color("#$event.calendarColor".toColorInt()))

		// event title and time
		Column(
			modifier = GlanceModifier.padding(start = 8.dp)
				.clickable(rippleOverride = R.drawable.transparent_ripple) { }) {
			// title
			// TODO() display limited amount of characters and handle overflow with dots e.g. "Hello Widget..."
			Text(
				event.summary,
				style = TextStyle(
					color = GlanceTheme.colors.onSurface,
					fontWeight = FontWeight.Bold,
					fontSize = 14.sp
				)
			)

			// start and end time
			Row(
				modifier = GlanceModifier,
				horizontalAlignment = Alignment.Start
			) {
				Text(
					event.startTime + " - " + event.endTime,
					modifier = GlanceModifier,
					style = TextStyle(
						color = GlanceTheme.colors.onSurface,
						fontSize = 14.sp
					),
				)
			}
		}
	}

}

@Composable
fun CalendarIndicator(radius: Int = 20, color: Color = Color.Blue) {
	Column(
		modifier = GlanceModifier
			.width(radius.dp)
			.height(radius.dp)
			.background(color)
			.cornerRadius((radius / 2).dp),
	) { }
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 200, heightDp = 422)
@Preview(widthDp = 400, heightDp = 500)
@Composable
fun VerticalWidgetPreview() {
	val eventData = ArrayList<UIEvent>()
	val allDayEvents = ArrayList<UIEvent>()
	for (i in 1..7) {
		eventData.add(
			UIEvent(
				"previewCalendar",
				"2196f3",
				"Hello Widget $i",
				"08:00",
				"17:00",
				isAllDay = false
			)
		)
	}

	eventData.add(
		UIEvent(
			"previewCalendar",
			"2196f3",
			"Summery",
			"Start Time",
			"End Time",
			isAllDay = false
		)
	)

	allDayEvents.add(
		UIEvent(
			"previewCalendar",
			"2196f3",
			"Summery",
			"Start Time",
			"End Time",
			isAllDay = true
		)
	)

	GlanceTheme(colors = AppTheme.colors) {
		WidgetBody(
			WidgetUIData(
				allDayEvents = allDayEvents,
				normalEvents = eventData,
			),
			headerCallback = {},
			newEventCallback = {}
		)
	}
}


