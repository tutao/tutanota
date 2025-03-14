package de.tutao.calendar.widget

import android.content.Context
import android.content.Intent
import android.util.TypedValue
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat.startActivity
import androidx.core.graphics.ColorUtils
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.absolutePadding
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentHeight
import androidx.glance.layout.wrapContentWidth
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.tutasdk.CalendarEvent
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.isAllDayEventByTimes
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

class VerticalWidget : GlanceAppWidget() {
	override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

	override suspend fun provideGlance(context: Context, id: GlanceId) {
		TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, 24f, context.resources.displayMetrics);
		// Load data needed to render the AppWidget.
		// Use `withContext` to switch to another thread for long running
		// operations.
		val db = AppDatabase.getDatabase(context, true)
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val sseStorage = SseStorage(db, keyStoreFacade)
		val userId = "OKV2uY3----4"

		val crypto = AndroidNativeCryptoFacade(context)
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
		val credentials = nativeCredentialsFacade.loadByUserId(userId)!!
			.toSdkCredentials()

		val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()).login(credentials)
		val calendars = sdk.calendarFacade().getCalendarsRenderData()

		val systemCalendar = Calendar.getInstance(TimeZone.getDefault())

		val events = sdk.calendarFacade()
			.getCalendarEvents(calendars.keys.first(), systemCalendar.timeInMillis.toULong())

		val allEvents: List<CalendarEvent> = events.shortEvents.plus(events.longEvents)

		// Remember mutable state for the data
//		val data = remember { mutableStateOf(allEvents) }

		// Apply transformations to each item in the list
		val allDayEvents: MutableList<Event> = mutableListOf()
		val normalEvents: MutableList<Event> = mutableListOf()

		val todayMidnight = Calendar.getInstance()
		todayMidnight.set(Calendar.HOUR_OF_DAY, 0)
		todayMidnight.set(Calendar.MINUTE, 0)
		todayMidnight.set(Calendar.SECOND, 0)
		todayMidnight.set(Calendar.MILLISECOND, 0)

		val tomorrowMidnight = Calendar.getInstance()
		tomorrowMidnight.add(Calendar.DAY_OF_YEAR, 1)
		tomorrowMidnight.set(Calendar.HOUR_OF_DAY, 0)
		tomorrowMidnight.set(Calendar.MINUTE, 0)
		tomorrowMidnight.set(Calendar.SECOND, 0)
		tomorrowMidnight.set(Calendar.MILLISECOND, 0)

		allEvents.forEach { ev ->
			val zoneId = ZoneId.systemDefault()
			val start = LocalDateTime.ofInstant(Instant.ofEpochMilli(ev.startTime.toLong()), zoneId)
			val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(ev.endTime.toLong()), zoneId)
			val formatter = DateTimeFormatter.ofPattern("HH:mm")
			val isAllDay = isAllDayEventByTimes(
				Date.from(Instant.ofEpochMilli(ev.startTime.toLong())),
				Date.from(Instant.ofEpochMilli(ev.endTime.toLong()))
			) || (ev.startTime.toLong() < todayMidnight.timeInMillis && ev.endTime.toLong() >= tomorrowMidnight.timeInMillis)

			val event = Event(
				ev.summary,
				start.format(formatter),
				end.format(formatter),
				isAllDay
			)

			if (isAllDay) {
				allDayEvents.add(event)
			} else {
				normalEvents.add(event)
			}
		}

		provideContent {
			GlanceTheme(
				colors = AppTheme.colors
			) {
				WidgetBody(
					WidgetData(normalEvents, allDayEvents),
					headerCallback = { openCalendarAgenda(context, userId) },
					newEventCallback = { openCalendarEditor(context, userId) }
				)
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

data class Event(
	val summary: String,
	val startTime: String,
	val endTime: String,
	val isAllDay: Boolean,
)

data class WidgetData(
	val normalEvents: List<Event>,
	val allDayEvents: List<Event>,
	val allDayEventsCount: Int = allDayEvents.size
)

@Composable
fun WidgetBody(_data: WidgetData, headerCallback: () -> Unit, newEventCallback: () -> Unit) {
	val data by rememberSaveable { mutableStateOf(_data) };
	val isEmpty = data.allDayEvents.isEmpty() && data.normalEvents.isEmpty()

	Column(
		modifier = GlanceModifier.padding(
			top = 12.dp,
			start = 12.dp,
			end = 12.dp,
			bottom = if (isEmpty) 0.dp else 12.dp
		)
			.background(GlanceTheme.colors.background)
			.fillMaxSize()
			.appWidgetBackground()
			.cornerRadius(8.dp),
	) {
		Header(
			allDayEvents = data.allDayEvents,
			onTap = headerCallback,
			onNewEvent = newEventCallback,
			hasAllDayEvents = data.allDayEvents.isNotEmpty()
		)

		if (isEmpty) {
			return@Column Column(
				verticalAlignment = Alignment.Vertical.Bottom,
				horizontalAlignment = Alignment.CenterHorizontally,
				modifier = GlanceModifier
					.fillMaxSize()
			) {
				Column(
					modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
					verticalAlignment = Alignment.Top,
					horizontalAlignment = Alignment.CenterHorizontally
				) {
					Text(
						"No Events",
						style = TextStyle(
							fontSize = 16.sp,
							color = GlanceTheme.colors.onBackground,
							textAlign = TextAlign.Center
						),
						maxLines = 2,
						modifier = GlanceModifier.padding(bottom = 8.dp)
					)
					Image(
						provider = ImageProvider(R.drawable.dog),
						contentDescription = "No events",
						contentScale = ContentScale.Fit,
						modifier = GlanceModifier.fillMaxWidth().defaultWeight().wrapContentHeight()
					)
				}
			}
		}

		LazyColumn {
			itemsIndexed(
				data.normalEvents.ifEmpty { data.allDayEvents },
				itemId = { index, _ -> index.toLong() }) { _, event ->
				Column {
					EventCard(event)
					Spacer(modifier = GlanceModifier.height(4.dp))
				}
			}
		}
	}
}

@Composable
private fun Header(allDayEvents: List<Event>, onTap: () -> Unit, onNewEvent: () -> Unit, hasAllDayEvents: Boolean) {
	val hasAllDayEvent = allDayEvents.isNotEmpty()
	val titleBottomPadding = if (hasAllDayEvent) 0.dp else (-8).dp
	val dateNow = LocalDateTime.now()

	Row(
		verticalAlignment = Alignment.Top,
		modifier = GlanceModifier.fillMaxWidth().padding(bottom = 8.dp)
	) {
		Column(
			modifier = GlanceModifier
				.clickable(rippleOverride = R.drawable.transparent_ripple) { onTap() }.defaultWeight()
		) {
			Text(
				style = TextStyle(
					fontWeight = FontWeight.Bold,
					fontSize = if (hasAllDayEvents) 20.sp else 32.sp,
					color = GlanceTheme.colors.secondary
				),
				text = dateNow.format(DateTimeFormatter.ofPattern(if (hasAllDayEvent) "EEEE dd" else "dd")),
				maxLines = 1,
				modifier = GlanceModifier.defaultWeight().wrapContentHeight()
					.absolutePadding(0.dp, (-7).dp, 0.dp, titleBottomPadding)
			)

			val subTitle = if (hasAllDayEvent) {
				allDayEvents.first().summary.ifEmpty { "<No title>" }
			} else {
				dateNow.format(DateTimeFormatter.ofPattern("EEEE"))
			}

			Row(
				modifier = GlanceModifier.defaultWeight()
			) {
				if (hasAllDayEvent) {
					val isLightBg = ColorUtils.calculateLuminance(Color.Blue.toArgb()) > 0.5
					val allDayIconColor =
						if (isLightBg) AppTheme.LightColors.onSurface else AppTheme.DarkColors.onSurface
					Image(
						provider = ImageProvider(R.drawable.ic_all_day),
						contentDescription = "Add event button",
						colorFilter = ColorFilter.tint(ColorProvider(allDayIconColor)),
						modifier = GlanceModifier.size(16.dp).background(Color.Blue).cornerRadius(10.dp)
							.padding(2.dp)
					)
				}

				Row {
					Text(
						style = TextStyle(
							color = GlanceTheme.colors.secondary,
							fontSize = 12.sp
						),
						maxLines = 1,
						text = subTitle,
						modifier = GlanceModifier.padding(start = if (hasAllDayEvent) 4.dp else 0.dp)
							.defaultWeight()
					)

					if (allDayEvents.size > 1) {
						Text(
							"+${allDayEvents.size - 1}", style = TextStyle(
								color = GlanceTheme.colors.secondary,
								fontSize = 12.sp,
								fontWeight = FontWeight.Bold
							),
							maxLines = 1,
							modifier = GlanceModifier.padding(start = 8.dp).defaultWeight().wrapContentWidth()
						)
					}
				}
			}
		}
		Row(
			modifier = GlanceModifier.defaultWeight().padding(start = 32.dp).wrapContentWidth(),
			horizontalAlignment = Alignment.End
		) {
			Box(
				contentAlignment = Alignment.Center,
				modifier = GlanceModifier
					.size(48.dp)
					.background(GlanceTheme.colors.primary)
					.cornerRadius(8.dp)
					.clickable(rippleOverride = R.drawable.transparent_ripple) {
						onNewEvent()
					}
			) {
				Image(
					provider = ImageProvider(R.drawable.ic_add),
					contentDescription = "Add event button",
					colorFilter = ColorFilter.tint(GlanceTheme.colors.onPrimary),
					modifier = GlanceModifier.size(24.dp)
				)
			}
		}
	}
}

@Composable
fun EventCard(event: Event) {
	Row(
		modifier = GlanceModifier.padding(horizontal = 8.dp, vertical = 4.dp)
			.background(GlanceTheme.colors.surface)
			.cornerRadius(8.dp)
			.fillMaxWidth(),
		verticalAlignment = Alignment.CenterVertically
	) {
		CalendarIndicator()

		// event title and time
		Column(
			modifier = GlanceModifier.padding(start = 8.dp)
				.clickable(rippleOverride = R.drawable.transparent_ripple) { }) {
			Text(
				event.summary.ifEmpty { "<No title>" },
				style = TextStyle(
					color = GlanceTheme.colors.onSurface,
					fontWeight = FontWeight.Bold,
					fontSize = 14.sp
				),
				maxLines = 1
			)

			Text(
				if (event.isAllDay) "All day" else event.startTime + " - " + event.endTime,
				modifier = GlanceModifier,
				style = TextStyle(
					color = GlanceTheme.colors.onSurface,
					fontSize = 10.sp
				),
			)
		}
	}

}

@Composable
fun CalendarIndicator(radius: Int = 16, color: Color = Color.Blue) {
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
	val eventData = ArrayList<Event>()
	val allDayEvents = ArrayList<Event>()
	for (i in 1..7) {
		eventData.add(
			Event(
				"Hello Widget $i",
				"08:00",
				"17:00",
				isAllDay = false
			)
		)
	}

	eventData.add(
		Event(
			"Summery",
			"Start Time",
			"End Time",
			isAllDay = false
		)
	)

	allDayEvents.add(
		Event(
			"Summery",
			"Start Time",
			"End Time",
			isAllDay = false
		)
	)

	GlanceTheme(colors = AppTheme.colors) {
		WidgetBody(
			WidgetData(
				allDayEvents = allDayEvents,
				normalEvents = eventData,
			),
			headerCallback = {},
			newEventCallback = {},
		)
	}
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 200, heightDp = 200)
@Preview(widthDp = 400, heightDp = 500)
@Preview(widthDp = 800, heightDp = 500)
@Composable
fun VerticalWidgetPreviewNoEvents() {
	val eventData = ArrayList<Event>()
	val allDayEvents = ArrayList<Event>()

	GlanceTheme(colors = AppTheme.colors) {
		WidgetBody(
			WidgetData(
				allDayEvents = allDayEvents,
				normalEvents = eventData,
			),
			headerCallback = {},
			newEventCallback = {},
		)
	}
}


