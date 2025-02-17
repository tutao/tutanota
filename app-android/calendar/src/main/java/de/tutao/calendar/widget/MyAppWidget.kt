package de.tutao.calendar.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.padding
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
		var events = sdk.calendarFacade().getCalendarEvents(calendars.keys.first())

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

@Composable
fun MyContent(events: CalendarEventsList) {
	val allEvents = events.shortEvents.plus(events.longEvents)

	// Remember mutable state for the data
	val data = remember { mutableStateOf(allEvents) }

	// Apply transformations to each item in the list
	val eventsData = data.value.map { event ->
		val zoneId = ZoneId.systemDefault() // You can use a specific time zone, e.g., ZoneId.of("Europe/Berlin")
		// Convert the timestamp to LocalDateTime
		val start = LocalDateTime.ofInstant(Instant.ofEpochMilli(event.startTime.toLong()), zoneId)
		val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(event.startTime.toLong()), zoneId)

		// Define a custom date-time format
		val formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
		// Format the start and end LocalDateTime values

		EventData(event.summary, start.format(formatter), end.format(formatter))
	}

	Scaffold(modifier = GlanceModifier.padding(16.dp)) {
		LazyColumn {
			itemsIndexed(
				eventsData,
				itemId = { index, _ -> index.toLong() }) { index, event ->
				Column(
					modifier = GlanceModifier
						.padding(bottom = 8.dp) // Optional: Add padding
				) {
					Column(
						modifier = GlanceModifier
							.background(ColorProvider(Color.LightGray))
							.padding(8.dp) // Optional: Add padding
					) {

						Text(
							"${event.summary}",
							modifier = GlanceModifier.padding(8.dp).clickable(actionStartActivity<MainActivity>()),
							style = TextStyle(color = ColorProvider(R.color.darkDarkest), fontWeight = FontWeight.Bold)
						)
						Row {
							Text(
								"${event.startTime}",
								modifier = GlanceModifier.padding(8.dp).clickable(actionStartActivity<MainActivity>()),
								style = TextStyle(color = ColorProvider(R.color.darkLighter))
							)
							Text(
								"${event.endTime}",
								modifier = GlanceModifier.padding(8.dp).clickable(actionStartActivity<MainActivity>()),
								style = TextStyle(color = ColorProvider(R.color.darkLighter))
							)
						}
					}
				}
			}
		}
	}
}




