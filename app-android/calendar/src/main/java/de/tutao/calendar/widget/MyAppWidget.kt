package de.tutao.calendar.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.glance.Button
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials

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
		val credentials = nativeCredentialsFacade.loadByUserId("OJIbOl9----0")!!.toSdkCredentials()

		val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()).login(credentials)
		var calendars = sdk.calendarFacade().getCalendarsRenderData();
		var events = sdk.calendarFacade().getCalendarEvents(calendars.keys.first())

		var startTime = events.shortEvents.first().startTime; //FIXME problems with parsing DateTime

		provideContent {
			GlanceTheme {
				// create your AppWidget here
				MyContent()
			}
		}
	}
}

@Composable
fun MyContent() {


	val riversList = arrayOf("Nile", "Amazon", "Yangtze", "Negro", "Solimoes")
//	Scaffold(modifier = GlanceModifier.padding(16.dp), backgroundColor = ColorProvider(R.color.red)) {
	Scaffold(modifier = GlanceModifier.padding(16.dp)) {

		Column(
			horizontalAlignment = Alignment.CenterHorizontally
		) {
			Text(text = "Start activity:", modifier = GlanceModifier.padding(16.dp))
			Button(
				text = "Open Tuta Calendar",
				onClick = actionStartActivity<MainActivity>(),
			)
			Text("River names:")
			LazyColumn {
				items(riversList) { river: String ->
					Text(river, modifier = GlanceModifier.padding(8.dp))
				}

				itemsIndexed(riversList, itemId = { index, _ -> index.toLong() }) { index, river ->
					Text(
						"$river at index $index",
						modifier = GlanceModifier.padding(8.dp).clickable(
							actionStartActivity<MainActivity>()
						),
						style = TextStyle(color = ColorProvider(R.color.red))
					)
				}
			}
		}
	}
}

@Preview
@Composable
fun MyContentPreview() {
	MyContent()
}



