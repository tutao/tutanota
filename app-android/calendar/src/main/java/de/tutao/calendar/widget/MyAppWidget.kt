package de.tutao.calendar.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.absolutePadding
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.tutasdk.CalendarEventsList
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
		val credentials = nativeCredentialsFacade.loadByUserId("OJXq2s3----0")!!
			.toSdkCredentials() // FIXME Get the user from config page

		val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()).login(credentials)
		var calendars = sdk.calendarFacade().getCalendarsRenderData();
		var events = sdk.calendarFacade()
			.getCalendarEvents(calendars.keys.first()) // FIXME Change this to an static event array for UI development if needed

		provideContent {
			GlanceTheme {
				// create your AppWidget here
				MyContent(events)
			}
		}
	}
}

data class EventData(
	val summary: String,
	val startTime: String,
	val endTime: String,
)

/**
 * idea: overload function to handle both CalendarEventsList and my DemoCalendarEventsList (needed for the preview)
 * main function should take the Demo class, second overloading function should take original class and cast down to Demo class
 * it should simulate this: fun MyContent(events: CalendarEventsList || DemoCalendarEventsList)
 */
//@Composable
//fun MyContent(events: CalendarEventsList) {
//	val shortEvents: List<DummyCalendarEvent> = mutableListOf()
//	val longEvents: List<DummyCalendarEvent> = mutableListOf()
//
//	// short
//	for(shortEvent in events.shortEvents) {
//
//
//		val dummyCalendarEvent = DummyCalendarEvent(shortEvent.summary, shortEvent.startTime, shortEvent.endTime)
//
//		shortEvents.add(dummyCalendarEvent)
//	}
//	// long
//	for(longEvent in events.longEvents) {
//
//	}
//
//	val dummyCalendarEventsList: DummyCalendarEventsList = TODO()
//}


@Composable
fun MyContent(events: CalendarEventsList) {
	val allEvents = events.shortEvents.plus(events.longEvents)

	// Remember mutable state for the data
	val data = remember { mutableStateOf(allEvents) }

	// Apply transformations to each item in the list
	val eventsData = data.value.map { event ->
		val zoneId = ZoneId.systemDefault()
		val start = LocalDateTime.ofInstant(Instant.ofEpochMilli(event.startTime.toLong()), zoneId)
		val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(event.startTime.toLong()), zoneId)
		val formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
		EventData(event.summary, start.format(formatter), end.format(formatter))
	}

	Scaffold(modifier = GlanceModifier.padding(vertical = 16.dp, horizontal = 20.dp).background(Color.LightGray),
		titleBar = {
			Row(modifier = GlanceModifier.padding(bottom = 16.dp), verticalAlignment = Alignment.CenterVertically) {

				Image(
					provider = ImageProvider(R.mipmap.ic_launcher),
					contentDescription = null,
					modifier = GlanceModifier.width(60.dp).height(60.dp).absolutePadding(right = 8.dp)
				)
				Column(modifier = GlanceModifier.clickable { println("Open agenda") }) {
					Text(
						style = TextStyle(fontWeight = FontWeight.Bold, fontSize = 20.sp), text = "20 February"
					)

					Text(
						modifier = GlanceModifier.cornerRadius(8.dp), text = "5 all day events"
					)
				}
				Row(modifier = GlanceModifier.fillMaxWidth(), horizontalAlignment = Alignment.End) {
					// FIXME Missing Icon button
				}
			}
		}) {
		Column {
			LazyColumn(
				modifier = GlanceModifier.fillMaxWidth()
			) {
				itemsIndexed(eventsData, itemId = { index, _ -> index.toLong() }) { index, event ->
					Column(
						modifier = GlanceModifier.padding(bottom = 8.dp) // Optional: Add padding
					) {
						Column(
							modifier = GlanceModifier.background(ColorProvider(R.color.white)).cornerRadius(8.dp)
								.padding(8.dp) // Optional: Add padding
						) {

							Text(
								"${event.summary}",
								modifier = GlanceModifier.padding(8.dp).clickable(actionStartActivity<MainActivity>()),
								style = TextStyle(
									color = ColorProvider(R.color.darkDarkest), fontWeight = FontWeight.Bold
								)
							)
							Row {
								Text(
									"${event.startTime}",
									modifier = GlanceModifier.padding(8.dp)
										.clickable(actionStartActivity<MainActivity>()),
									style = TextStyle(color = ColorProvider(R.color.darkLighter))
								)
								Text(
									"${event.endTime}",
									modifier = GlanceModifier.padding(8.dp)
										.clickable(actionStartActivity<MainActivity>()),
									style = TextStyle(color = ColorProvider(R.color.darkLighter))
								)
							}
						}
					}
				}
			}
		}
	}
}

/**
 * simulate datastructure as we only need these three attributes
 */
data class DummyCalendarEvent(
	val summary: String, val startTime: Long, val endTime: Long
)

data class DummyCalendarEventsList(
	var shortEvents: List<DummyCalendarEvent>, var longEvents: List<DummyCalendarEvent>
)

@Preview
@Composable
fun MyContentPreview() {
	// preview cant use data from sdk so it needs dummy data to work
	// TODO() use proper type for time
	val dummyEvents = DummyCalendarEventsList(
		shortEvents = listOf(
			DummyCalendarEvent(summary = "Meeting", startTime = 800, endTime = 900)
		), longEvents = listOf(
			DummyCalendarEvent(summary = "Conference", startTime = 1000, endTime = 800)
		)
	)

	// MyContent(dummyEvents)
	DummyStaticWidgetContent()
}

/**
 * test how and if preview works
 */
@OptIn(ExperimentalGlancePreviewApi::class)
@Composable
fun DummyStaticWidgetContent() {
	Column(
		modifier = GlanceModifier.fillMaxSize().padding(16.dp),
		verticalAlignment = Alignment.CenterVertically,
		horizontalAlignment = Alignment.CenterHorizontally
	) {
		Text("Hello Calendar Widget!")
		Row {
			Text("Button A here :)")
			Text("  Button B here ;)")
		}
	}
}



