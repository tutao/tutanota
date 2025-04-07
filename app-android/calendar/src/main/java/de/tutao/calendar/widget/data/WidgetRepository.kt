package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WIDGET_SETTINGS_PREFIX
import de.tutao.calendar.widget.widgetDataStore
import de.tutao.tutasdk.CalendarEventsList
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json
import java.util.Date

abstract class WidgetRepository {
	protected val json = Json { ignoreUnknownKeys = true }
	protected var cachedEvents: MutableMap<GeneratedId, CalendarEventsList> = mutableMapOf()

	open suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, now: Date) {
		throw NotImplementedError()
	}

	open suspend fun storeSettings(context: Context, widgetId: Int, settings: SettingsDao) {
		throw NotImplementedError()
	}

	open suspend fun loadCredentials(credentialsFacade: NativeCredentialsFacade): List<PersistedCredentials> {
		throw NotImplementedError()
	}

	open suspend fun loadCalendars(
		userId: GeneratedId,
		credentialsFacade: NativeCredentialsFacade,
		sdk: Sdk
	): Map<GeneratedId, CalendarRenderData> {
		throw NotImplementedError()
	}

	open suspend fun loadEvents(
		userId: GeneratedId,
		calendars: List<GeneratedId>,
		credentialsFacade: NativeCredentialsFacade,
		loggedInSdk: LoggedInSdk
	): Map<GeneratedId, CalendarEventsList> {
		throw NotImplementedError()
	}

	open suspend fun loadEvents(calendars: List<GeneratedId>): Map<GeneratedId, CalendarEventsList> {
		throw NotImplementedError()
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