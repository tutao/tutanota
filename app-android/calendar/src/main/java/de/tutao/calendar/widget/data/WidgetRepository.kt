package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import de.tutao.calendar.widget.WIDGET_CACHE_DATE_PREFIX
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WIDGET_SETTINGS_PREFIX
import de.tutao.calendar.widget.widgetCacheDataStore
import de.tutao.calendar.widget.widgetDataStore
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.ipc.UnencryptedCredentials
import de.tutao.tutashared.push.toSdkCredentials
import kotlinx.coroutines.flow.first
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.Date

abstract class WidgetRepository() {
	protected val json = Json { ignoreUnknownKeys = true }

	open suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, now: Date) {
		throw NotImplementedError()
	}

	suspend fun storeSettings(context: Context, widgetId: Int, settings: SettingsDao) {
		val databaseWidgetIdentifier = "${WIDGET_SETTINGS_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)
		val serializedSettings = json.encodeToString(settings)

		context.widgetDataStore.edit { preferences ->
			preferences[preferencesKey] = serializedSettings
		}
	}

	open suspend fun loadCredentials(credentialsFacade: NativeCredentialsFacade): List<PersistedCredentials> {
		throw NotImplementedError()
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
		return calendarFacade.getCalendarsRenderData().toMutableMap().toSortedMap(Comparator<GeneratedId> { a, b ->
			when {
				a > b -> 1
				a < b -> -1
				else -> 0
			}
		})
	}

	open suspend fun loadEvents(
		context: Context,
		widgetId: Int,
		userId: GeneratedId,
		calendars: List<GeneratedId>,
		credentials: UnencryptedCredentials,
		loggedInSdk: LoggedInSdk,
		cryptoFacade: AndroidNativeCryptoFacade
	): Map<GeneratedId, CalendarEventListDao> {
		throw NotImplementedError()
	}

	open suspend fun loadEvents(
		context: Context,
		widgetId: Int,
		calendars: List<GeneratedId>,
		credentials: UnencryptedCredentials,
		cryptoFacade: AndroidNativeCryptoFacade
	): Map<GeneratedId, CalendarEventListDao> {
		throw NotImplementedError()
	}

	open suspend fun loadCache(
		context: Context,
		widgetId: Int,
		calendars: List<GeneratedId>,
		cryptoFacade: AndroidNativeCryptoFacade,
		credentials: UnencryptedCredentials
	): Map<GeneratedId, CalendarEventListDao> {
		throw NotImplementedError()
	}

	open suspend fun storeCache(
		context: Context,
		widgetId: Int,
		eventsMap: Map<GeneratedId, CalendarEventListDao>,
		cryptoFacade: AndroidNativeCryptoFacade,
		credentials: UnencryptedCredentials
	) {
		throw NotImplementedError()
	}

	suspend fun loadCacheCreationDate(context: Context, widgetId: Int): CacheDateDao? {
		val databaseWidgetIdentifier = "${WIDGET_CACHE_DATE_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)

		val preferences = context.widgetCacheDataStore.data.first()
		val encodedPreference = preferences[preferencesKey] ?: return null

		return json.decodeFromString<CacheDateDao>(encodedPreference)
	}

	suspend fun loadLastSync(context: Context, widgetId: Int): LastSyncDao? {
		val databaseWidgetIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)

		val preferences = context.widgetDataStore.data.first()
		val encodedPreference = preferences[preferencesKey] ?: return null

		return json.decodeFromString<LastSyncDao>(encodedPreference)
	}

	suspend fun loadSettings(context: Context, widgetId: Int): SettingsDao? {
		val databaseWidgetIdentifier = "${WIDGET_SETTINGS_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)

		val preferences = context.widgetDataStore.data.first()
		val encodedPreference = preferences[preferencesKey] ?: return null

		return json.decodeFromString<SettingsDao>(encodedPreference)
	}

	suspend fun eraseLastSyncForWidget(context: Context, glanceId: GlanceId) {
		val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(glanceId)
		val databaseWidgetIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)

		updateAppWidgetState(context, glanceId) { prefs ->
			prefs.remove(preferencesKey)
		}
	}

	suspend fun eraseSettingsForWidget(context: Context, glanceId: GlanceId) {
		val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(glanceId)
		val databaseWidgetIdentifier = "${WIDGET_SETTINGS_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)

		updateAppWidgetState(context, glanceId) { prefs ->
			prefs.remove(preferencesKey)
		}
	}
}