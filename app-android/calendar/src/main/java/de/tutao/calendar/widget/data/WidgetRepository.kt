package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WIDGET_SETTINGS_PREFIX
import de.tutao.calendar.widget.dataStore
import de.tutao.tutasdk.CalendarEventsList
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.push.toSdkCredentials
import kotlinx.coroutines.flow.first
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encodeToString
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.decodeStructure
import kotlinx.serialization.encoding.encodeStructure
import kotlinx.serialization.json.Json
import java.time.Instant
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

@Serializable
data class SettingsDao(
	val userId: GeneratedId,
	val calendars: Map<GeneratedId, @Serializable(with = CalendarRenderDataSerializer::class) CalendarRenderData>
)

object CalendarRenderDataSerializer : KSerializer<CalendarRenderData> {
	override val descriptor = buildClassSerialDescriptor("CalendarRenderData") {
		element<String>("name")
		element<String>("color")
	}

	override fun serialize(encoder: Encoder, value: CalendarRenderData) {
		encoder.encodeStructure(descriptor) {
			encodeStringElement(descriptor, 0, value.name)
			encodeStringElement(descriptor, 1, value.color)
		}
	}

	override fun deserialize(decoder: Decoder): CalendarRenderData {
		return decoder.decodeStructure(descriptor) {
			var name = ""
			var color = ""
			while (true) {
				when (val index = decodeElementIndex(descriptor)) {
					0 -> name = decodeStringElement(descriptor, 0)
					1 -> color = decodeStringElement(descriptor, 1)
					CompositeDecoder.DECODE_DONE -> break
					else -> error("Unknown index $index")
				}
			}
			CalendarRenderData(name, color)
		}
	}
}

/**
 * @param context Application context used to access the database and the crypto facade.
 *
 * SHOULD NEVER RECEIVE ACTIVITY CONTEXT
 */
class WidgetRepository() {
	private val json = Json { ignoreUnknownKeys = true }


	suspend fun loadCredentials(credentialsFacade: NativeCredentialsFacade): List<PersistedCredentials> {
		return credentialsFacade.loadAll()
	}

	suspend fun loadCalendars(
		userId: GeneratedId,
		credentialsFacade: NativeCredentialsFacade,
		sdk: Sdk
	): Map<GeneratedId, CalendarRenderData> {
		val credential = credentialsFacade.loadByUserId(userId)?.toSdkCredentials()
			?: throw Exception("Missing credentials for user $userId during calendars loading")

		val loggedInSdk = sdk.login(credential)
		val calendarFacade = loggedInSdk.calendarFacade()
		return calendarFacade.getCalendarsRenderData()
	}

	suspend fun loadEvents(
		userId: GeneratedId,
		calendars: List<GeneratedId>,
		credentialsFacade: NativeCredentialsFacade,
		loggedInSdk: LoggedInSdk
	): Map<GeneratedId, CalendarEventsList> {
		val loadedCredentials = credentialsFacade.loadByUserId(userId)!!.toSdkCredentials()

		val calendarFacade = loggedInSdk.calendarFacade()
		val systemCalendar = Calendar.getInstance(TimeZone.getDefault())

		var calendarEventsList: Map<GeneratedId, CalendarEventsList> = HashMap()

		calendars.forEach { calendarId ->
			val events = calendarFacade.getCalendarEvents(calendarId, (systemCalendar.timeInMillis).toULong())
			calendarEventsList = calendarEventsList.plus(calendarId to events)
		}

		return calendarEventsList
	}

	suspend fun loadLastSync(context: Context, widgetId: Int): Date? {
		val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$widgetId"
		val preferencesKey = longPreferencesKey(lastSyncIdentifier)
		val lastSyncTimestamp =
			context.dataStore.data.first { preferences -> preferences[preferencesKey] != null }[preferencesKey]
				?: return null

		return Date.from(Instant.ofEpochMilli(lastSyncTimestamp))
	}

	suspend fun storeLastSync(context: Context, widgetId: Int, lastSync: Date) {
		val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$widgetId"
		val preferencesKey = longPreferencesKey(lastSyncIdentifier)
		val lastSyncTimestamp = lastSync.time

		context.dataStore.edit { preferences ->
			preferences[preferencesKey] = lastSyncTimestamp
		}
	}

	suspend fun loadSettings(context: Context, widgetId: Int): SettingsDao? {
		val databaseWidgetIdentifier = "${WIDGET_SETTINGS_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)
		val rawPreferencesFlow =
			context.dataStore.data.first { preferences -> preferences[preferencesKey] != null }[preferencesKey]
				?: return null

		return json.decodeFromString<SettingsDao>(rawPreferencesFlow)
	}

	suspend fun storeSettings(context: Context, widgetId: Int, settings: SettingsDao) {
		val databaseWidgetIdentifier = "${WIDGET_SETTINGS_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)
		val serializedSettings = json.encodeToString(settings)

		context.dataStore.edit { preferences ->
			preferences[preferencesKey] = serializedSettings
		}
	}
}