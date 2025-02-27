package de.tutao.calendar.widget

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.ImageProvider
import androidx.glance.action.actionStartActivity
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
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
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
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class MyAppWidget : GlanceAppWidget() {

	override suspend fun provideGlance(context: Context, id: GlanceId) {
		// Load data needed to render the AppWidget.
		// Use `withContext` to switch to another thread for long running
		// operations.
		val db = AppDatabase.getDatabase(context, true)
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val sseStorage = SseStorage(db, keyStoreFacade)

		val crypto = AndroidNativeCryptoFacade(context)
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
		val credentials = nativeCredentialsFacade.loadByUserId("OK62Kzg----0")!!
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
			val formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
			EventData(event.summary, start.format(formatter), end.format(formatter))
		}
		provideContent {
			GlanceTheme {
				// create your AppWidget here
				println(eventsData)
				MyContent(eventsData)
			}
		}
	}
}

data class EventData(
	val summary: String,
	val startTime: String,
	val endTime: String,
)

@SuppressLint("RestrictedApi")
@Composable
fun MyContent(eventsData: List<EventData>) {

	Scaffold(
		modifier = GlanceModifier
			.padding(vertical = 16.dp, horizontal = 20.dp)
			.background(Color.LightGray),
		titleBar = {
			Row(
				modifier = GlanceModifier
					.padding(bottom = 16.dp),
				verticalAlignment = Alignment.CenterVertically
			) {
				Column(modifier = GlanceModifier.clickable { println("Open agenda") }) {
					// date e.g. 20 February
					Text(
						style = TextStyle(fontWeight = FontWeight.Bold, fontSize = 20.sp),
						text = "20 February" // TODO() fetch data
					)
					// all day events
					// TODO() fix border size and remove test color
					BorderedContent(borderWidth = 5, borderColor = ColorProvider(R.color.red)) {
						Text(
							modifier = GlanceModifier
								.cornerRadius(8.dp)
								.width(122.dp)
								.height(32.dp)
								.padding(start = 8.dp, top = 8.dp, end = 8.dp, bottom = 8.dp),
							text = "5 all day events"
						)
					}
				}
				// create event button
				Row(
					modifier = GlanceModifier
						.fillMaxWidth(),
					horizontalAlignment = Alignment.End
				) {
					SquareIconButton(
						imageProvider = ImageProvider(R.drawable.ic_add),
						contentDescription = "Add event button",
						modifier = GlanceModifier, // TODO() use correct size
						onClick = { println("Open event creator") }, // TODO() open correct activity
						backgroundColor = ColorProvider(R.color.blue) // TODO() proper color

					)

				}
			}
		}) {
		// calendar events
		Column {
			LazyColumn(
				modifier = GlanceModifier
					.fillMaxSize()
			) {
				itemsIndexed(eventsData, itemId = { index, _ -> index.toLong() }) { _, event ->
					// events
					Column(
						modifier = GlanceModifier
							.padding(bottom = 8.dp)
					) {
						EventCard(event)
					}
				}
			}
		}
	}
}

@SuppressLint("RestrictedApi")
@Composable
fun EventCard(event: EventData) {
	// TODO() whats Scaffold and what is it needed for?
	Scaffold(
		modifier = GlanceModifier
	) {
		// circle icon and event text
		Row(
			modifier = GlanceModifier
		) {
			// event card
			// TODO() fill full width
			Column(
				modifier = GlanceModifier
					.background(ColorProvider(R.color.white)).cornerRadius(8.dp)
					.padding(vertical = 8.dp)
			) {
				// circle icon
				// TODO() align to left/ start
				// TODO() align vertically centred
				// TODO() fix padding
				Row(
					modifier = GlanceModifier,
					verticalAlignment = Alignment.CenterVertically
				) {
					Circle()
				}
				// event title
				// TODO() display limited amount of characters and handle overflow with dots e.g. "Hello Widget..."
				Text(
					event.summary,
					modifier = GlanceModifier.padding(8.dp).clickable { println("Open event details") },
					style = TextStyle(
						color = ColorProvider(R.color.darkDarkest), fontWeight = FontWeight.Bold
					)
				)
				// event start and end time
				Row(
					modifier = GlanceModifier
						.clickable(actionStartActivity<MainActivity>()),
					horizontalAlignment = Alignment.Start
				) {
					Text(
						event.startTime + " - " + event.endTime,
						modifier = GlanceModifier.padding(vertical = 8.dp),
						style = TextStyle(color = ColorProvider(R.color.darkLighter))
					)
				}
			}
		}
	}
}

@Composable
fun Circle(radius: Int = 30, color: Color = Color.Blue) {
	Column(
		modifier = GlanceModifier
			.width(radius.dp)
			.height(radius.dp)
			.background(color)
			.cornerRadius((radius / 2).dp)
	) {

	}
}

/**
 * get a boarder around your content as glance doesn't support this natively
 */
@SuppressLint("RestrictedApi")
@Composable
fun BorderedContent(
	borderColor: ColorProvider = ColorProvider(R.color.darkLighter),
	borderWidth: Int,
	content: @Composable () -> Unit

) {
	Column(
		modifier = GlanceModifier
			.background(borderColor)
			.cornerRadius(8.dp)
	) {
		Column(
			modifier = GlanceModifier
				.padding(borderWidth.dp)
				.background(ColorProvider(R.color.white))
		) {
			content()
		}
	}

}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 130, heightDp = 422)
@Preview(widthDp = 400, heightDp = 500)
@Composable
fun MyContentPreview() {
	val eventData = ArrayList<EventData>()
	for (i in 1..7) {
		eventData.add(
			EventData(
				"Hello Widget $i",
				"08:00",
				"17:00"
			)
		)
	}
	eventData.add(
		EventData(
			"Summery",
			"Start Time",
			"End Time"
		)
	)
	MyContent(eventData)
}



