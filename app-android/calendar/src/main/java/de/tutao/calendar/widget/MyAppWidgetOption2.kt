package de.tutao.calendar.widget

import android.annotation.SuppressLint
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
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.material3.ColorProviders
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import de.tutao.calendar.R
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

class MyAppWidgetOption2 : GlanceAppWidget() {


	object MyAppWidgetGlanceColorScheme {
		private val LightColors = lightColorScheme(
			primary = Color(0xFFF6F6F6),
			onPrimary = Color(0xFF303030),
			secondary = Color(0xFFFFFFFF),
			onSecondary = Color(0xFF303030),
			background = Color(0xFFF6F6F6),
			onBackground = Color(0xFF303030),
			surface = Color(0xFFFFFFFF),
			onSurface = Color(0xFF303030),
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
		val credentials = nativeCredentialsFacade.loadByUserId("OKVQTu1----0")!!
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
			EventDataOption2(event.summary, start.format(formatter), end.format(formatter))
		}
		provideContent {
			GlanceTheme(
				colors = MyAppWidgetGlanceColorScheme.colors
			) {
				// create your AppWidget here
				MyContentOption2(eventsData)
			}
		}
	}
}

data class EventDataOption2(
	val summary: String,
	val startTime: String,
	val endTime: String,
)

@SuppressLint("RestrictedApi")
@Composable
fun MyContentOption2(eventsData: List<EventDataOption2>) {
	Scaffold(
		modifier = GlanceModifier
			.padding(horizontal = 20.dp),
		backgroundColor = GlanceTheme.colors.background,
		horizontalPadding = 0.dp,
		titleBar = {
			Spacer(modifier = GlanceModifier.height(16.dp))
			Row(
				verticalAlignment = Alignment.CenterVertically
			) {
				Column(
					modifier = GlanceModifier
						.clickable { println("Open agenda") }
				) {
					// date e.g. 20 February
					Text(
						style = TextStyle(
							fontWeight = FontWeight.Bold,
							fontSize = 16.sp,
							color = GlanceTheme.colors.onBackground
						),
						text = "20 February", // TODO() fetch data
						maxLines = 1,
					)

					Spacer(modifier = GlanceModifier.height(4.dp))

					// all day events
					// TODO() border is thicker in the corners. should probably switch to xml or no border
					BorderedContentOption2(borderWidth = 1) {
						Text(
							modifier = GlanceModifier
								.padding(vertical = 4.dp),
							style = TextStyle(
								color = GlanceTheme.colors.onBackground,
								fontSize = 14.sp
							),
							text = "57 all day"
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
						modifier = GlanceModifier
							.size(44.dp),
						onClick = { println("Open event creator") },
						backgroundColor = ColorProvider(R.color.blue) // TODO() proper color

					)
				}
			}
			Spacer(modifier = GlanceModifier.height(16.dp))
		}) {
		// calendar events
		// we remove the scrollbar in res/values/styles.xml
		LazyColumn {
			itemsIndexed(eventsData, itemId = { index, _ -> index.toLong() }) { _, event ->
				Column {
					EventCardOption2(event)
					Spacer(modifier = GlanceModifier.height(8.dp))
				}
			}
		}
	}
}

@SuppressLint("RestrictedApi")
@Composable
fun EventCardOption2(event: EventDataOption2) {
	Row(
		modifier = GlanceModifier.padding(8.dp)
			.background(GlanceTheme.colors.secondary)
			.cornerRadius(8.dp)
			.fillMaxWidth(),
		verticalAlignment = Alignment.CenterVertically
	) {
		CircleOption2()

		// event title and time
		Column(
			modifier = GlanceModifier
				.padding(8.dp)
		) {
			// title
			// TODO() display limited amount of characters and handle overflow with dots e.g. "Hello Widget..."
			Text(
				event.summary,
				modifier = GlanceModifier
					.clickable { println("Open event details") },
				style = TextStyle(
					color = GlanceTheme.colors.onSecondary,
					fontWeight = FontWeight.Bold,
					fontSize = 14.sp
				)
			)

			Spacer(modifier = GlanceModifier.height(8.dp))

			// start and end time
			Row(
				modifier = GlanceModifier,
				horizontalAlignment = Alignment.Start
			) {
				Text(
					event.startTime + " - " + event.endTime,
					modifier = GlanceModifier,
					style = TextStyle(
						color = GlanceTheme.colors.onSecondary,
						fontSize = 14.sp
					),
				)
			}
		}
	}

}

@Composable
fun CircleOption2(radius: Int = 20, color: Color = Color.Blue) {
	Column(
		modifier = GlanceModifier
			.width(radius.dp)
			.height(radius.dp)
			.background(color)
			.cornerRadius((radius / 2).dp),
	) {

	}
}

/**
 * get a boarder around your content as glance doesn't support this natively
 */
@SuppressLint("RestrictedApi")
@Composable
fun BorderedContentOption2(
	borderColor: ColorProvider = GlanceTheme.colors.onBackground,
	borderWidth: Int,
	content: @Composable () -> Unit

) {
	Column(
		modifier = GlanceModifier
			.background(borderColor)
			.padding(top = borderWidth.dp)
//			.cornerRadius(8.dp)
	) {
		Column(
			modifier = GlanceModifier
//				.cornerRadius(8.dp)
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
fun MyContentOption2Preview() {
	val eventData = ArrayList<EventDataOption2>()
	for (i in 1..7) {
		eventData.add(
			EventDataOption2(
				"Hello Widget $i",
				"08:00",
				"17:00"
			)
		)
	}
	eventData.add(
		EventDataOption2(
			"Summery",
			"Start Time",
			"End Time"
		)
	)
	MyContentOption2(eventData)
}


