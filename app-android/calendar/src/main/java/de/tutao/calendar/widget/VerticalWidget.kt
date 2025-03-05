package de.tutao.calendar.widget

import android.content.Context
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
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
import androidx.glance.material3.ColorProviders
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import de.tutao.calendar.R
import de.tutao.calendar.widget.VerticalWidget.MyAppWidgetGlanceColorScheme
import de.tutao.tutasdk.CalendarEvent
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class VerticalWidget : GlanceAppWidget() {


	object MyAppWidgetGlanceColorScheme {
		private val LightColors = lightColorScheme(
			primary = Color(0xFF013E85),
			onPrimary = Color(0xFFFFFFFF),
			secondary = Color(0xFF303030),
			onSecondary = Color(0xFF013E85),
			background = Color(0xFFF6F6F6),
			onBackground = Color(0xFF303030),
			surface = Color(0xFFFFFFFF),
			onSurface = Color(0xFF303030),
			primaryContainer = Color(0xFF000000)
		)

		private val DarkColors = darkColorScheme(
			primary = Color(0xFF232323),
			onPrimary = Color(0xFFDDDDDD),
			secondary = Color(0xFF4D4D4D),
			onSecondary = Color(0xFFDDDDDD),
			background = Color(0xFF232323),
			onBackground = Color(0xFFDDDDDD),
			surface = Color(0xFF4D4D4D),
			onSurface = Color(0xFFDDDDDD),
			primaryContainer = Color(0xFFFFFFFF)
		)
		val colors = ColorProviders(
			light = LightColors,
			dark = DarkColors
		)
	}

	override suspend fun provideGlance(context: Context, id: GlanceId) {
		// Load data needed to render the AppWidget.
		// Use `withContext` to switch to another thread for long running
		// operations.
		val db = AppDatabase.getDatabase(context, true)
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val sseStorage = SseStorage(db, keyStoreFacade)

		val crypto = AndroidNativeCryptoFacade(context)
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
		val credentials = nativeCredentialsFacade.loadByUserId("OKV2uY3----4")!!
			.toSdkCredentials() // FIXME Get the user from config page

		val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()).login(credentials)
		val calendars = sdk.calendarFacade().getCalendarsRenderData()
		val events = sdk.calendarFacade()
			.getCalendarEvents(calendars.keys.first()) // FIXME Change this to an static event array for UI development if needed

		val allEvents: List<CalendarEvent> = events.shortEvents.plus(events.longEvents)

		// Remember mutable state for the data
//		val data = remember { mutableStateOf(allEvents) }

		// Apply transformations to each item in the list
		val eventsData = allEvents.map { event ->
			val zoneId = ZoneId.systemDefault()
			val start = LocalDateTime.ofInstant(Instant.ofEpochMilli(event.startTime.toLong()), zoneId)
			val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(event.startTime.toLong()), zoneId)
			val formatter = DateTimeFormatter.ofPattern("HH:mm")
			Event(event.summary, start.format(formatter), end.format(formatter))
		}
		provideContent {
			GlanceTheme(
				colors = MyAppWidgetGlanceColorScheme.colors
			) {
				// create your AppWidget here
				WidgetBody(eventsData)
			}
		}
	}
}

data class Event(
	val summary: String,
	val startTime: String,
	val endTime: String,
)

@Composable
fun WidgetBody(eventsData: List<Event>) {
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
				Header()
			}
		}
	) {
		// calendar events
		// we remove the scrollbar in res/values/styles.xml
		LazyColumn {
			itemsIndexed(eventsData, itemId = { index, _ -> index.toLong() }) { _, event ->
				Column {
					EventCard(event)
					Spacer(modifier = GlanceModifier.height(4.dp))
				}
			}
		}
	}
}

@Composable
private fun Header() {
	Column(
		modifier = GlanceModifier
			.clickable { println("Open agenda") }
	) {
		// date e.g. 20 February
		Text(
			style = TextStyle(
				fontWeight = FontWeight.Bold,
				fontSize = 16.sp,
				color = GlanceTheme.colors.secondary
			),
			text = "20 February", // TODO() fetch data
			maxLines = 1,
			modifier = GlanceModifier.padding(bottom = 4.dp)
		)
		// all day events
		// TODO() border is thicker in the corners. should probably switch to xml or no border
		Spacer(modifier = GlanceModifier.background(GlanceTheme.colors.primaryContainer).height(1.dp))
		Text(
			modifier = GlanceModifier
				.padding(top = 4.dp),
			style = TextStyle(
				color = GlanceTheme.colors.secondary,
				fontSize = 14.sp
			),
			text = "57 all day"
		)
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
			onClick = { println("Open event creator") },
			backgroundColor = GlanceTheme.colors.primary
		)
	}
}

@Composable
fun EventCard(event: Event) {
	Row(
		modifier = GlanceModifier.padding(8.dp)
			.background(GlanceTheme.colors.surface)
			.cornerRadius(8.dp)
			.fillMaxWidth(),
		verticalAlignment = Alignment.CenterVertically
	) {
		CalendarIndicator()

		// event title and time
		Column(modifier = GlanceModifier.padding(start = 8.dp)) {
			// title
			// TODO() display limited amount of characters and handle overflow with dots e.g. "Hello Widget..."
			Text(
				event.summary,
				modifier = GlanceModifier.clickable { println("Open event details") },
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

/**
 * get a boarder around your content as glance doesn't support this natively
 */
@Composable
fun BorderedContent(
	borderColor: ColorProvider = GlanceTheme.colors.primaryContainer,
	borderWidth: Int,
	content: @Composable () -> Unit

) {
	Column(
		modifier = GlanceModifier
			.background(borderColor)
			.padding(top = borderWidth.dp)
	) {
		Column(
			modifier = GlanceModifier
				.background(GlanceTheme.colors.background)
		) {
			content()
		}
	}

}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 200, heightDp = 422)
@Preview(widthDp = 400, heightDp = 500)
@Composable
fun VerticalWidgetPreview() {
	val eventData = ArrayList<Event>()
	for (i in 1..7) {
		eventData.add(
			Event(
				"Hello Widget $i",
				"08:00",
				"17:00"
			)
		)
	}
	eventData.add(
		Event(
			"Summery",
			"Start Time",
			"End Time"
		)
	)

	GlanceTheme(colors = MyAppWidgetGlanceColorScheme.colors) { WidgetBody(eventData) }
}


